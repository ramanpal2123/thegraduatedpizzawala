from django.urls import path

from .views import (
    CategoryListView,
    TableDetailView,
    OrderCreateView,
    OrderDetailView,
    OrderListView,
    OrderUpdateView,
    AdminLoginView,
    FeedbackCreateView,
    TodayAnalyticsView,
    OrderSearchView,
    FeedbackListView,
    OrderCancelView,
    ToppingListView,
    AdminCategoryListCreateView,
    AdminCategoryDeleteView,
    AdminMenuItemListCreateView,
    AdminMenuItemDetailView,
    AdminVariantCreateView,
    AdminVariantDeleteView,
    AdminToppingListCreateView,
    AdminToppingDeleteView,
    AdminOfferListCreateView,
    AdminOfferDetailView,
    ActiveOffersView,
    ValidateOfferView,
    ChangePasswordView,
    AdminUserListCreateView,
    AdminUserDeleteView,
    AdminSignupVerifyOTPView,
    RequestPasswordResetOTPView,
    VerifyOTPAndResetPasswordView,
    CreateRazorpayOrderView,
    VerifyRazorpayPaymentView,
)

urlpatterns = [
    # Menu & Table
    path('menu/', CategoryListView.as_view(), name='menu-list'),
    path('table/<int:table_number>/', TableDetailView.as_view(), name='table-detail'),

    # Orders
    path('order/create/', OrderCreateView.as_view(), name='order-create'),
    path('order/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('order/<int:pk>/update/', OrderUpdateView.as_view(), name='order-update'),
    path('order/<int:pk>/cancel/', OrderCancelView.as_view(), name='order-cancel'),
    path('order-search/', OrderSearchView.as_view(), name='order-search'),

    # Admin Authentication
    path('admin-login/', AdminLoginView.as_view(), name='admin-login'),
    path('admin/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('admin/request-otp/', RequestPasswordResetOTPView.as_view(), name='request-otp'),
    path('admin/verify-otp-reset/', VerifyOTPAndResetPasswordView.as_view(), name='verify-otp-reset'),

    # Admin Users
    path('admin/users/', AdminUserListCreateView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', AdminUserDeleteView.as_view(), name='admin-user-delete'),
    path(
        'admin/users/verify-otp/',
        AdminSignupVerifyOTPView.as_view(),
        name='admin-signup-verify-otp'
    ),

    # Feedback
    path('feedback/create/', FeedbackCreateView.as_view(), name='feedback-create'),
    path('feedback/', FeedbackListView.as_view(), name='feedback-list'),

    # Analytics
    path('analytics/today/', TodayAnalyticsView.as_view(), name='today-analytics'),

    # Toppings
    path('toppings/', ToppingListView.as_view(), name='topping-list'),

    # Admin Categories
    path(
        'admin/categories/',
        AdminCategoryListCreateView.as_view(),
        name='admin-category-list'
    ),
    path(
        'admin/categories/<int:pk>/',
        AdminCategoryDeleteView.as_view(),
        name='admin-category-delete'
    ),

    # Admin Menu Items
    path(
        'admin/menu-items/',
        AdminMenuItemListCreateView.as_view(),
        name='admin-menuitem-list'
    ),
    path(
        'admin/menu-items/<int:pk>/',
        AdminMenuItemDetailView.as_view(),
        name='admin-menuitem-detail'
    ),

    # Admin Variants
    path(
        'admin/variants/',
        AdminVariantCreateView.as_view(),
        name='admin-variant-create'
    ),
    path(
        'admin/variants/<int:pk>/',
        AdminVariantDeleteView.as_view(),
        name='admin-variant-delete'
    ),

    # Admin Toppings
    path(
        'admin/toppings/',
        AdminToppingListCreateView.as_view(),
        name='admin-topping-list'
    ),
    path(
        'admin/toppings/<int:pk>/',
        AdminToppingDeleteView.as_view(),
        name='admin-topping-delete'
    ),

    # Admin Offers
    path(
        'admin/offers/',
        AdminOfferListCreateView.as_view(),
        name='admin-offer-list'
    ),
    path(
        'admin/offers/<int:pk>/',
        AdminOfferDetailView.as_view(),
        name='admin-offer-detail'
    ),

    # Offers
    path('offers/active/', ActiveOffersView.as_view(), name='active-offers'),
    path('offers/validate/', ValidateOfferView.as_view(), name='validate-offer'),

    # Razorpay Payments
    path(
        'razorpay/create-order/',
        CreateRazorpayOrderView.as_view(),
        name='razorpay-create-order'
    ),
    path(
        'razorpay/verify-payment/',
        VerifyRazorpayPaymentView.as_view(),
        name='razorpay-verify-payment'
    ),
]