import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

import requests
from django.core.files.base import ContentFile
from orders.models import MenuItem

PEXELS_API_KEY = "1Bsf4krusjC74rZMpjq2SghmP7i2NlATnRHOYfpIqKrVlDYrXSkLihHp"
HEADERS = {'Authorization': PEXELS_API_KEY}

used_photo_ids = set()


def build_search_query(item):
    name = item.name.lower()

    if 'pizza' in name:
        # Category ke hisaab se better keywords add karo taaki generic na aaye
        base = item.name.replace('Pizza', '').strip()
        return f"{base} pizza food"

    if 'garlic bread' in name or 'bread' in name:
        return f"{item.name} food"

    if 'tea' in name or 'chai' in name:
        return 'masala chai indian tea cup'

    if 'coffee' in name:
        return 'coffee cup cafe'

    if 'cake' in name:
        return 'chocolate lava cake dessert'

    if 'burger' in name:
        return f"{item.name} food"

    if 'combo' in name:
        return 'indian food combo meal'

    return f"{item.name} food"


def fetch_unique_photo(query, per_page=10):
    """Pexels se photos fetch karo aur pehla wala do jo abhi tak use nahi hua."""
    try:
        search_url = f"https://api.pexels.com/v1/search?query={query}&per_page={per_page}"
        response = requests.get(search_url, headers=HEADERS, timeout=15)
        data = response.json()
        photos = data.get('photos', [])

        for photo in photos:
            if photo['id'] not in used_photo_ids:
                used_photo_ids.add(photo['id'])
                return photo['src']['medium']

        # Agar sab already use ho chuke, to bhi pehla wala de do (better than empty)
        if photos:
            return photos[0]['src']['medium']

    except Exception as e:
        print(f"Search error: {e}")

    return None


items = MenuItem.objects.all()

for item in items:
    query = build_search_query(item)
    image_url = fetch_unique_photo(query)

    if image_url:
        try:
            img_response = requests.get(image_url, timeout=15)
            if img_response.status_code == 200:
                file_name = f"{item.id}.jpg"
                item.image.save(file_name, ContentFile(img_response.content), save=True)
                print(f"Image added: {item.name}")
            else:
                print(f"Download failed: {item.name}")
        except Exception as e:
            print(f"Error downloading {item.name}: {e}")
    else:
        print(f"No result found: {item.name}")

print("\n✅ Process complete! Unique images assigned.")