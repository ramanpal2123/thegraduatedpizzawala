import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from orders.models import Topping, MenuItem, Category

toppings_data = [
    ("Veg Topping", 20, 30, 50),
    ("Extra Cheese", 30, 40, 60),
    ("Chilly Cheese Burst", 40, 70, 90),
    ("Cheese Burst", 40, 70, 90),
    ("Thin Crust", 20, 30, 40),
]

for name, small, medium, large in toppings_data:
    topping, created = Topping.objects.get_or_create(
        name=name,
        defaults={'price_small': small, 'price_medium': medium, 'price_large': large},
    )
    if created:
        print(f"Topping added: {name}")
    else:
        print(f"Already exists: {name}")

# Saare pizza categories ke items pe toppings allow karo
pizza_categories = Category.objects.filter(name__icontains='pizza')
updated_count = 0

for category in pizza_categories:
    for item in category.items.all():
        if not item.allow_toppings:
            item.allow_toppings = True
            item.save()
            updated_count += 1

print(f"\n✅ {updated_count} pizza items pe toppings enable ho gayi!")