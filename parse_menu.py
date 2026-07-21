import json

with open("raw_menu.txt", "r", encoding="utf-8") as f:
    lines = [l.strip() for l in f.readlines() if l.strip()]

menu_items = []
i = 0
item_id = 1
while i < len(lines):
    # Pattern:
    # 0: Thick Cold Coffee (Offer)Cold Coffee -> Name + Category
    # 1: Thick Cold Coffee (Offer) -> Name
    # 2: 4.8 -> Rating
    # 3: 12 Months Special Offer -> Desc
    # 4: ₹20.00 -> Price
    # 5: Add -> Skip
    if i + 5 >= len(lines):
        break
    
    line0 = lines[i]
    name = lines[i+1]
    
    # Category is whatever is at the end of line0 after name
    category_str = line0[len(name):].strip()
    if not category_str:
        category_str = "snack"
    
    # Map category to something clean
    category_map = {
        "Cold Coffee": "cold",
        "Hot Coffee & Tea": "hot",
        "Shakes": "shakes",
        "Fries & Cheese": "fries",
        "Pasta & Noodles": "pasta",
        "Snacks": "snack",
        "Desserts": "dessert",
        "Sandwiches": "sandwich",
        "Pizza": "pizza",
        "Burgers": "burger"
    }
    category = category_map.get(category_str, "snack")

    rating = float(lines[i+2])
    desc = lines[i+3]
    price_str = lines[i+4].replace("₹", "").replace(",", "")
    price = float(price_str)
    
    # Skip "Add" or anything before the next item
    i += 5
    if i < len(lines) and lines[i].lower() == "add":
        i += 1

    menu_items.append({
        "id": item_id,
        "name": name,
        "sub": "",
        "category": category,
        "price": price,
        "rating": rating,
        "reviews": 120, # dummy
        "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80", # dummy image
        "desc": desc
    })
    item_id += 1

print(json.dumps(menu_items, indent=2))
