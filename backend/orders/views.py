from rest_framework import generics
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.db.models import Sum, Q
from django.utils import timezone
from django.core.mail import send_mail
from .models import PasswordResetOTP, AdminProfile, PendingAdminSignup
from .models import Table, Category, MenuItem, Order, OrderItem, Feedback, Topping, ItemVariant, Offer
from .serializers import (
    TableSerializer, CategorySerializer, MenuItemSerializer,
    OrderSerializer, FeedbackSerializer, ToppingSerializer, ItemVariantSerializer,
    OfferSerializer
)

from rest_framework.parsers import MultiPartParser, FormParser

import re
import razorpay
from django.conf import settings












class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all().order_by('display_order')
    serializer_class = CategorySerializer


class TableDetailView(generics.RetrieveAPIView):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    lookup_field = 'table_number'


class OrderCreateView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class ToppingListView(generics.ListAPIView):
    queryset = Topping.objects.all()
    serializer_class = ToppingSerializer

class OrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Order.objects.all().order_by('-created_at')
        filter_type = self.request.query_params.get('filter')
        date_param = self.request.query_params.get('date')

        today = timezone.now().date()

        if filter_type == 'live':
            queryset = queryset.filter(status__in=['pending', 'preparing', 'ready'])
            # Online payment wale orders jab tak paid nahi hote, kitchen/admin ko nahi dikhne chahiye
            queryset = queryset.exclude(payment_method='online', payment_status='pending')
        elif filter_type == 'today':
            queryset = queryset.filter(created_at__date=today)
        elif filter_type == 'yesterday':
            yesterday = today - timezone.timedelta(days=1)
            queryset = queryset.filter(created_at__date=yesterday)
        elif date_param:
            queryset = queryset.filter(created_at__date=date_param)

        return queryset


class OrderUpdateView(generics.UpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)

        if user is not None and user.is_staff:
            token, created = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'username': user.username})
        return Response({'error': 'Invalid credentials'}, status=400)


class FeedbackCreateView(generics.CreateAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer


class TodayAnalyticsView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filter_type = request.query_params.get('filter', 'today')
        date_param = request.query_params.get('date')
        today = timezone.now().date()

        orders_qs = Order.objects.all()

        if filter_type == 'today':
            orders_qs = orders_qs.filter(created_at__date=today)
        elif filter_type == 'yesterday':
            yesterday = today - timezone.timedelta(days=1)
            orders_qs = orders_qs.filter(created_at__date=yesterday)
        elif filter_type == 'all':
            pass
        elif date_param:
            orders_qs = orders_qs.filter(created_at__date=date_param)

        total_orders = orders_qs.count()
        total_revenue = orders_qs.filter(payment_status='paid').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        pending_payment_amount = orders_qs.filter(payment_status='pending').aggregate(
            total=Sum('total_amount')
        )['total'] or 0

        top_items = (
            OrderItem.objects.filter(order__in=orders_qs)
            .values('menu_item__name')
            .annotate(total_qty=Sum('quantity'))
            .order_by('-total_qty')[:5]
        )

        return Response({
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'pending_payment_amount': pending_payment_amount,
            'top_items': list(top_items),
        })


class FeedbackListView(generics.ListAPIView):
    serializer_class = FeedbackSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Feedback.objects.all().order_by('-created_at')
        filter_type = self.request.query_params.get('filter', 'all')
        date_param = self.request.query_params.get('date')
        today = timezone.now().date()

        if filter_type == 'today':
            queryset = queryset.filter(created_at__date=today)
        elif filter_type == 'yesterday':
            yesterday = today - timezone.timedelta(days=1)
            queryset = queryset.filter(created_at__date=yesterday)
        elif filter_type == 'all':
            pass
        elif date_param:
            queryset = queryset.filter(created_at__date=date_param)

        return queryset

class OrderSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        table_number = request.query_params.get('table')
        name = request.query_params.get('name')
        order_id = request.query_params.get('order_id')

        if not table_number or not name:
            return Response({'error': 'Table number aur naam dono zaroori hain.'}, status=400)

        try:
            table = Table.objects.get(table_number=table_number)
        except Table.DoesNotExist:
            return Response({'error': 'Ye table exist nahi karta.'}, status=404)

        orders = Order.objects.filter(table=table, customer_name__iexact=name.strip())

        if order_id:
            orders = orders.filter(id=order_id)

        orders = orders.order_by('-created_at')[:5]

        if not orders.exists():
            return Response({'error': 'Koi order nahi mila. Naam/table check karo.'}, status=404)

        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)    
    
class OrderCancelView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order nahi mila.'}, status=404)

        if order.status != 'pending':
            return Response(
                {'error': 'Ye order ab cancel nahi ho sakta, kitchen banana shuru kar chuki hai.'},
                status=400,
            )

        order.status = 'cancelled'
        order.save()
        return Response({'message': 'Order cancel ho gaya.'})    
    

class AdminCategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all().order_by('display_order')
    serializer_class = CategorySerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


class AdminCategoryDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


class AdminMenuItemListCreateView(generics.ListCreateAPIView):
    queryset = MenuItem.objects.all().order_by('category', 'name')
    serializer_class = MenuItemSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]


class AdminMenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] 


class AdminVariantCreateView(generics.CreateAPIView):
    queryset = ItemVariant.objects.all()
    serializer_class = ItemVariantSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


class AdminVariantDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ItemVariant.objects.all()
    serializer_class = ItemVariantSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]       


class AdminToppingListCreateView(generics.ListCreateAPIView):
    queryset = Topping.objects.all()
    serializer_class = ToppingSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


class AdminToppingDeleteView(generics.DestroyAPIView):
    queryset = Topping.objects.all()
    serializer_class = ToppingSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]    


class AdminOfferListCreateView(generics.ListCreateAPIView):
    queryset = Offer.objects.all().order_by('-created_at')
    serializer_class = OfferSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


class AdminOfferDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


class ActiveOffersView(generics.ListAPIView):
    queryset = Offer.objects.filter(is_active=True)
    serializer_class = OfferSerializer
    permission_classes = [AllowAny]

class ValidateOfferView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        try:
            offer = Offer.objects.get(code=code, is_active=True)
            return Response({
                'valid': True,
                'discount_percent': offer.discount_percent,
                'title': offer.title,
            })
        except Offer.DoesNotExist:
            return Response({'valid': False, 'error': 'Invalid ya inactive offer code.'}, status=404)
        


from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password, make_password


class ChangePasswordView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({'error': 'Purana aur naya password dono zaroori hain.'}, status=400)

        if not request.user.check_password(old_password):
            return Response({'error': 'Purana password galat hai.'}, status=400)

        if len(new_password) < 6:
            return Response({'error': 'Naya password kam se kam 6 characters ka hona chahiye.'}, status=400)

        request.user.set_password(new_password)
        request.user.save()
        return Response({'message': 'Password change ho gaya.'})


class AdminUserListCreateView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    EMAIL_REGEX = re.compile(r'^[\w\.\+\-]+@[\w\-]+\.[a-zA-Z]{2,}$')

    def get(self, request):
        users = User.objects.filter(is_staff=True).order_by('date_joined')
        data = []
        for u in users:
            phone = None
            if hasattr(u, 'admin_profile'):
                phone = u.admin_profile.phone_number
            data.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'phone_number': phone,
                'date_joined': u.date_joined,
                'is_you': u.id == request.user.id,
            })
        return Response(data)

    def post(self, request):
        """Step 1: Request OTP. Admin abhi nahi banta, sirf OTP bhejta hai."""
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Username aur password zaroori hain.'}, status=400)

        if not email:
            return Response({'error': 'Email zaroori hai.'}, status=400)

        if not self.EMAIL_REGEX.match(email):
            return Response({'error': 'Ye email valid nahi hai. Sahi format daalo (jaise name@example.com).'}, status=400)

        if len(password) < 6:
            return Response({'error': 'Password kam se kam 6 characters ka hona chahiye.'}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Ye username already exist karta hai.'}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Ye email already kisi aur admin ke paas hai.'}, status=400)

        # Purane pending signups (isi email ke) clean karo
        PendingAdminSignup.objects.filter(email=email).delete()

        otp = PendingAdminSignup.generate_otp()
        PendingAdminSignup.objects.create(
            username=username,
            email=email,
            password_hash=make_password(password),
            otp=otp,
        )

        send_mail(
            subject='The Graduated Pizza Wala — Admin Signup OTP',
            message=f'Aapka admin account verify karne ke liye OTP hai: {otp}\n\nYe 10 minute ke liye valid hai. Agar aapne ye request nahi ki, ignore kar dijiye.',
            from_email=None,
            recipient_list=[email],
        )

        masked_email = email[:2] + '***' + email[email.index('@'):]
        return Response({'message': f'OTP bhej diya gaya hai {masked_email} par. Verify karo.'})


class AdminSignupVerifyOTPView(APIView):
    """Step 2: OTP verify karo, tabhi asli admin account bane."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        email = request.data.get('email', '').strip()
        otp = request.data.get('otp', '').strip()

        if not email or not otp:
            return Response({'error': 'Email aur OTP dono zaroori hain.'}, status=400)

        pending = PendingAdminSignup.objects.filter(
            email=email, otp=otp, is_used=False
        ).order_by('-created_at').first()

        if not pending or not pending.is_valid():
            return Response({'error': 'OTP galat hai ya expire ho gaya hai.'}, status=400)

        # Double check ki koi aur isi beech duplicate na bana ho
        if User.objects.filter(username=pending.username).exists():
            return Response({'error': 'Ye username ab available nahi hai.'}, status=400)
        if User.objects.filter(email=pending.email).exists():
            return Response({'error': 'Ye email ab available nahi hai.'}, status=400)

        user = User(username=pending.username, email=pending.email)
        user.password = pending.password_hash
        user.is_staff = True
        user.save()

        pending.is_used = True
        pending.save()

        return Response({'message': 'Admin account verify ho gaya aur ban gaya.', 'id': user.id})


class AdminUserDeleteView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if pk == request.user.id:
            return Response({'error': 'Aap khud ko delete nahi kar sakte.'}, status=400)

        try:
            user = User.objects.get(pk=pk, is_staff=True)
        except User.DoesNotExist:
            return Response({'error': 'User nahi mila.'}, status=404)

        user.delete()
        return Response({'message': 'Admin remove ho gaya.'})


    
class RequestPasswordResetOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('identifier', '').strip()

        if not identifier:
            return Response({'error': 'Username, email ya phone number daalo.'}, status=400)

        user = None

        # Pehle username se try karo
        user = User.objects.filter(username=identifier, is_staff=True).first()

        # Nahi mila to email se try karo
        if not user:
            user = User.objects.filter(email=identifier, is_staff=True).first()

        # Nahi mila to phone number se try karo
        if not user:
            profile = AdminProfile.objects.filter(phone_number=identifier).first()
            if profile and profile.user.is_staff:
                user = profile.user

        if not user:
            return Response({'error': 'Ye username, email ya phone number kisi admin se match nahi karta.'}, status=404)

        if not user.email:
            return Response({'error': 'Is account me email registered nahi hai. Admin se contact karo.'}, status=400)

        otp = PasswordResetOTP.generate_otp()
        PasswordResetOTP.objects.create(user=user, otp=otp)

        send_mail(
            subject='The Graduated Pizza Wala — Password Reset OTP',
            message=f'Aapka OTP hai: {otp}\n\nYe 10 minute ke liye valid hai. Agar aapne ye request nahi ki, ignore kar dijiye.',
            from_email=None,
            recipient_list=[user.email],
        )

        masked_email = user.email[:2] + '***' + user.email[user.email.index('@'):]
        return Response({'message': f'OTP bhej diya gaya hai {masked_email} par.', 'username': user.username})


class VerifyOTPAndResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        otp = request.data.get('otp', '').strip()
        new_password = request.data.get('new_password')

        if not username or not otp or not new_password:
            return Response({'error': 'Saari fields zaroori hain.'}, status=400)

        if len(new_password) < 6:
            return Response({'error': 'Password kam se kam 6 characters ka hona chahiye.'}, status=400)

        try:
            user = User.objects.get(username=username, is_staff=True)
        except User.DoesNotExist:
            return Response({'error': 'User nahi mila.'}, status=404)

        otp_entry = PasswordResetOTP.objects.filter(
            user=user, otp=otp, is_used=False
        ).order_by('-created_at').first()

        if not otp_entry or not otp_entry.is_valid():
            return Response({'error': 'OTP galat hai ya expire ho gaya hai.'}, status=400)

        user.set_password(new_password)
        user.save()

        otp_entry.is_used = True
        otp_entry.save()

        return Response({'message': 'Password successfully reset ho gaya. Ab login karo.'})         


razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class CreateRazorpayOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        order_id = request.data.get('order_id')

        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order nahi mila.'}, status=404)

        # Razorpay amount paise mein chahiye (₹1 = 100 paise)
        amount_in_paise = int(float(order.total_amount) * 100)

        razorpay_order = razorpay_client.order.create({
            'amount': amount_in_paise,
            'currency': 'INR',
            'payment_capture': 1,
        })

        order.razorpay_order_id = razorpay_order['id']
        order.save()

        return Response({
            'razorpay_order_id': razorpay_order['id'],
            'razorpay_key_id': settings.RAZORPAY_KEY_ID,
            'amount': amount_in_paise,
            'currency': 'INR',
        })


class VerifyRazorpayPaymentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response({'error': 'Payment details incomplete hain.'}, status=400)

        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature,
        }

        try:
            razorpay_client.utility.verify_payment_signature(params_dict)
        except razorpay.errors.SignatureVerificationError:
            return Response({'error': 'Payment verify nahi ho paya. Signature invalid hai.'}, status=400)

        try:
            order = Order.objects.get(razorpay_order_id=razorpay_order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order nahi mila.'}, status=404)

        order.payment_status = 'paid'
        order.razorpay_payment_id = razorpay_payment_id
        order.save()

        return Response({'message': 'Payment verified! ✅', 'order_id': order.id})