from django.db import models
from django.contrib.auth.models import User

import random
from django.utils import timezone
from datetime import timedelta


class Table(models.Model):
    table_number = models.IntegerField(unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Table {self.table_number}"


class Category(models.Model):
    name = models.CharField(max_length=100)
    display_order = models.IntegerField(default=0)

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image = models.ImageField(upload_to='menu_images/', blank=True, null=True)
    is_veg = models.BooleanField(default=True)
    is_available = models.BooleanField(default=True)
    allow_toppings = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class ItemVariant(models.Model):
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='variants')
    size = models.CharField(max_length=50)  # e.g. Small, Medium, Large, Regular
    price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.menu_item.name} - {self.size} - ₹{self.price}"


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('served', 'Served'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('online', 'Online'),
        ('counter', 'Counter'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('pending', 'Pending'),
    ]

    table = models.ForeignKey(Table, on_delete=models.CASCADE)
    customer_name = models.CharField(max_length=100, default='Guest')
    customer_phone = models.CharField(max_length=15, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - Table {self.table.table_number}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    size = models.CharField(max_length=50, blank=True)
    quantity = models.IntegerField(default=1)
    price_at_order = models.DecimalField(max_digits=8, decimal_places=2)
    notes = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.quantity} x {self.menu_item.name}"
    

class Feedback(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='feedback')
    rating = models.IntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for Order #{self.order.id} - {self.rating} stars"


class Topping(models.Model):
    name = models.CharField(max_length=100)
    price_small = models.DecimalField(max_digits=8, decimal_places=2)
    price_medium = models.DecimalField(max_digits=8, decimal_places=2)
    price_large = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return self.name


class OrderItemTopping(models.Model):
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='toppings')
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.name} - ₹{self.price}"  

class Offer(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    discount_percent = models.IntegerField(default=0)  # e.g. 10 for 10% off
    code = models.CharField(max_length=30, unique=True)  # e.g. "SAVE10"
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.code})"    




class PasswordResetOTP(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        expiry_time = self.created_at + timedelta(minutes=10)
        return not self.is_used and timezone.now() <= expiry_time

    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))


class AdminProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    phone_number = models.CharField(max_length=15, unique=True, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}"


class PendingAdminSignup(models.Model):
    username = models.CharField(max_length=150)
    email = models.EmailField()
    password_hash = models.CharField(max_length=255)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        expiry_time = self.created_at + timedelta(minutes=10)
        return not self.is_used and timezone.now() <= expiry_time

    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))

    def __str__(self):
        return f"Pending: {self.username} ({self.email})"