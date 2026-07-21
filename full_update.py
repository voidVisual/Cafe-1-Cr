import json
import codecs

with open("raw_menu.txt", "r", encoding="utf-8") as f:
    lines = [l.strip() for l in f.readlines() if l.strip()]

menu_items = []
i = 0
item_id = 1
while i < len(lines):
    if i + 5 >= len(lines):
        break
    
    line0 = lines[i]
    name = lines[i+1]
    
    category_str = line0[len(name):].strip()
    if not category_str:
        category_str = "snack"
    
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

    try:
        rating = float(lines[i+2])
    except:
        rating = 4.5
    desc = lines[i+3]
    price_str = lines[i+4].replace("₹", "").replace(",", "")
    try:
        price = float(price_str)
    except:
        price = 0.0
    
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
        "reviews": 120,
        "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
        "desc": desc
    })
    item_id += 1

menu_data_str = "menu_data = " + json.dumps(menu_items, indent=2) + "\n"

with open("api/index.py", "r", encoding="utf-8") as f:
    api_lines = f.readlines()

out_lines = []
in_menu = False
for line in api_lines:
    if line.startswith("menu_data = ["):
        in_menu = True
        out_lines.append(menu_data_str)
    elif in_menu:
        if line.strip() == "]":
            in_menu = False
    else:
        out_lines.append(line)

new_get_menu = """@app.get("/api/menu")
def get_menu():
    items = list(menu_collection.find({}, {"_id": 0}))
    if len(items) == 8 and any(i.get("name") == "Cappuccino" and i.get("desc", "").startswith("A classic") for i in items):
        menu_collection.delete_many({})
        items = []
        
    if not items:
        menu_collection.insert_many(menu_data)
        items = list(menu_collection.find({}, {"_id": 0}))
    return items
"""

final_lines = []
in_get_menu = False
for line in out_lines:
    if line.startswith("@app.get(\"/api/menu\")"):
        in_get_menu = True
        final_lines.append(new_get_menu)
    elif in_get_menu:
        if line.strip() == "return items":
            in_get_menu = False
    else:
        final_lines.append(line)

with open("api/index.py", "w", encoding="utf-8") as f:
    f.writelines(final_lines)

print(f"Success! Updated with {len(menu_items)} items.")
