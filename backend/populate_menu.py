import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from orders.models import Category, MenuItem, ItemVariant

# Purana data clear mat karo, sirf naya add karo
# Agar dobara chalao to duplicate na bane, isliye get_or_create use karenge


def add_pizza_category(cat_name, items, sizes_prices, display_order):
    category, _ = Category.objects.get_or_create(
        name=cat_name, defaults={'display_order': display_order}
    )

    for item_name, description in items:
        menu_item, created = MenuItem.objects.get_or_create(
            category=category,
            name=item_name,
            defaults={'description': description, 'price': sizes_prices[0][1], 'is_veg': True},
        )
        if created:
            for size, price in sizes_prices:
                ItemVariant.objects.create(menu_item=menu_item, size=size, price=price)
            print(f"Added: {item_name}")
        else:
            print(f"Skipped (already exists): {item_name}")


def add_single_price_category(cat_name, items, display_order):
    category, _ = Category.objects.get_or_create(
        name=cat_name, defaults={'display_order': display_order}
    )

    for item_name, description, price in items:
        menu_item, created = MenuItem.objects.get_or_create(
            category=category,
            name=item_name,
            defaults={'description': description, 'price': price, 'is_veg': True},
        )
        if created:
            print(f"Added: {item_name}")
        else:
            print(f"Skipped (already exists): {item_name}")


# ---------------- PIZZA CATEGORIES ----------------

add_pizza_category(
    "Simple Veg Pizza",
    [
        ("Cheesy Mushroom Pizza", ""),
        ("Cheesy & Tomato Pizza", ""),
        ("Cheese & Corn Pizza", ""),
        ("Margherita Pizza", "Single Cheese Pizza"),
    ],
    [("Small", 99), ("Medium", 189), ("Large", 319)],
    1,
)

add_pizza_category(
    "Delight Pizza",
    [
        ("Double Cheese Margherita", "Extra Cheese Loaded"),
        ("Makhni Do Pyaza", "Makhni Gravy, Onion, Cheese"),
        ("Garden Veggie", "Onion, Capsicum, Tomato, Cheese"),
        ("Farmhouse Pizza", "Onion, Capsicum, Tomato, Mushroom"),
        ("Chilly Tangy Pizza", "Onion, Corn, Red Paprika, Green Chilly"),
    ],
    [("Small", 149), ("Medium", 249), ("Large", 410)],
    2,
)

add_pizza_category(
    "House Special Pizza",
    [
        ("Triple Cheese Loaded Pizza", "Cheese & Cheese Loaded"),
        ("Mexican Twist", "Onion, Capsicum, Tomato, Jalapeno"),
        ("Mac & Cheese", "Macaroni in cheddar cheese sauce, exotic herbs"),
        ("Peri Peri Paneer", "Peri Peri Paneer cubes, Red Paprika, Onion, Capsicum"),
        ("Chilly Cheese Pizza", "Green Chilly, Red Paprika, Mozzarella & Cheddar cheese"),
        ("Hawaiian Heat", "Grilled Pineapple, Red Paprika, Jalapeno, Sweet Corn"),
    ],
    [("Small", 179), ("Medium", 299), ("Large", 429)],
    3,
)

add_pizza_category(
    "House Special Pizza - 2",
    [
        ("Veggie Supreme Pizza", "Onion, Capsicum, Tomato, Jalapeno, Black Olive"),
        ("Korean Spicy Pizza", "Red Pepper, Onion, Chilly, Jalapeno, Sauce"),
        ("Chilly Paneer Pizza", "Desi Chinese Style Chilly Paneer, Capsicum, Onion, Chinese Sauce"),
        ("Mushroom Affair", "Grilled Mushroom, Onion, Olive, Tomato"),
        ("Paneer 65", "Onion, Capsicum, Red Paprika, Paneer 65"),
    ],
    [("Small", 179), ("Medium", 299), ("Large", 429)],
    4,
)

add_pizza_category(
    "Graduate Special Pizza",
    [
        ("Graduate Special Pizza", "Onion, Capsicum, Tomato, Olive, Jalapeno, Red Paprika, Corn, Paneer"),
        ("Paneer Tikka Butter Masala", "Onion, Capsicum, Red Paprika, Exotic Paneer"),
        ("Cheesy Chipotle Paneer", "Paneer, Onion, Tomato, Capsicum, Jalapeno, Chipotle Sauce"),
        ("Makhni Paneer Pizza", "Onion, Capsicum, Corn, Paneer"),
        ("Tandoori Paneer Pizza", "Onion, Capsicum, Paneer"),
    ],
    [("Small", 199), ("Medium", 319), ("Large", 449)],
    5,
)

add_pizza_category(
    "Graduate Delicious Pizza",
    [
        ("Deluxe Veg Pizza", "Onion, Capsicum, Corn, Mushroom, Paneer & Extra Cheese"),
        ("Extra Vaganza Delicious Pizza", "Onion, Capsicum, Tomato, Mushroom, Corn, Black Olive, Jalapeno, Extra Cheese"),
    ],
    [("Small", 249), ("Medium", 339), ("Large", 510)],
    6,
)

# ---------------- SINGLE PRICE CATEGORIES ----------------

add_single_price_category(
    "Garlic Bread",
    [
        ("Classic Garlic Bread", "", 39),
        ("Supreme Garlic Bread", "Corn, Olive, Jalapeno, Onion", 49),
        ("Paneer Tikka Garlic Bread", "Chunky juicy paneer & red paprika", 59),
        ("Cheesy Garlic Bread", "", 59),
        ("Garlic Bread Stick", "", 49),
        ("Corn Stuff Garlic Bread", "Corn, Jalapeno with Cheese", 79),
        ("Special Paneer Tikka Garlic Bread", "Exotic paneer, red paprika, onion, capsicum", 89),
    ],
    7,
)

add_single_price_category(
    "Combo Meals",
    [
        ("Budget Mania Combo (Onion)", "@199 combo", 59),
        ("Budget Mania Combo (Tomato)", "@199 combo", 59),
        ("Budget Mania Combo (Capsicum)", "@199 combo", 65),
        ("Budget Mania Combo (Soya)", "@199 combo", 49),
        ("Budget Mania Combo (Corn)", "@199 combo", 65),
        ("Graduate Combo (Onion & Capsicum)", "@299 combo", 89),
        ("Graduate Combo (Soya & Corn)", "@299 combo", 79),
        ("Graduate Combo (Onion & Paneer)", "@299 combo", 89),
        ("Graduate Combo (Jalapeno & Pineapple)", "@299 combo", 89),
    ],
    8,
)

add_single_price_category(
    "Tea & Desserts",
    [
        ("Regular Tea", "", 10),
        ("Kulhad Chai", "", 20),
        ("Special Coffee", "", 20),
        ("Choco Lava Cake", "", 59),
    ],
    9,
)

add_single_price_category(
    "Burger Pizza",
    [
        ("Burger Pizza Classic", "Oven baked buns with cheese, topping onion capsicum", 49),
        ("Burger Pizza Delicious", "Oven baked buns with cheese, topping onion capsicum red paprika paneer", 69),
    ],
    10,
)

add_single_price_category(
    "Extras",
    [
        ("Corn & Paneer", "", 89),
        ("Capsicum & Paneer", "", 89),
        ("Veg Over Loaded Pizza", "Corn, Tomato, Mushroom, Jalapeno", 110),
    ],
    11,
)

print("\n✅ Poora menu add ho gaya!")