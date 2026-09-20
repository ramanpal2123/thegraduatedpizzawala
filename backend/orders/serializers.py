



from rest_framework import serializers
from .models import (
    Table, Category, MenuItem, Order, OrderItem, ItemVariant,
    Feedback, Topping, OrderItemTopping, Offer
)


class ItemVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemVariant
        fields = ['id', 'menu_item', 'size', 'price']
        extra_kwargs = {
            'menu_item': {'required': False},
        }


class MenuItemSerializer(serializers.ModelSerializer):
    variants = ItemVariantSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MenuItem
        fields = ['id', 'category', 'category_name', 'name', 'description', 'price', 'image',
                  'is_veg', 'is_available', 'allow_toppings', 'variants']
        extra_kwargs = {
            'image': {'required': False},
        }


class CategorySerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'display_order', 'items']


class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = '__all__'


class ToppingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topping
        fields = ['id', 'name', 'price_small', 'price_medium', 'price_large']


class OrderItemToppingSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItemTopping
        fields = ['name', 'price']


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    toppings = OrderItemToppingSerializer(many=True, required=False)

    class Meta:
        model = OrderItem
        fields = ['menu_item', 'menu_item_name', 'size', 'quantity', 'price_at_order', 'notes', 'toppings']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False)

    class Meta:
        model = Order
        fields = ['id', 'table', 'customer_name', 'customer_phone', 'status', 'payment_method',
                  'payment_status', 'total_amount', 'razorpay_order_id', 'razorpay_payment_id',
                  'created_at', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            toppings_data = item_data.pop('toppings', [])
            order_item = OrderItem.objects.create(order=order, **item_data)
            for topping_data in toppings_data:
                OrderItemTopping.objects.create(order_item=order_item, **topping_data)
        return order


class FeedbackSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='order.customer_name', read_only=True)
    table_number = serializers.IntegerField(source='order.table.table_number', read_only=True)
    items = serializers.SerializerMethodField()

    class Meta:
        model = Feedback
        fields = ['id', 'order', 'customer_name', 'table_number', 'rating', 'comment', 'created_at', 'items']

    def get_items(self, obj):
        return [item.menu_item.name for item in obj.order.items.all()]


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = ['id', 'title', 'description', 'discount_percent', 'code', 'is_active', 'created_at']