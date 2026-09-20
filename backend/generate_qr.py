import qrcode
import os

# Yaha apni website ka base URL daalo
BASE_URL = "http://192.168.45.126:5174"

# Kitne tables hain, utna range set karo
TOTAL_TABLES = 3

output_folder = "table_qr_codes"
os.makedirs(output_folder, exist_ok=True)

for table_number in range(1, TOTAL_TABLES + 1):
    url = f"{BASE_URL}/?table={table_number}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    file_path = os.path.join(output_folder, f"table_{table_number}.png")
    img.save(file_path)

    print(f"Table {table_number} QR generated: {file_path}  (Link: {url})")

print("\nSab QR codes ban gaye! 'table_qr_codes' folder check karo.")