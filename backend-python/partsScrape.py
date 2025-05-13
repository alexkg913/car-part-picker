import requests
from bs4 import BeautifulSoup
import time
import urllib.parse
import csv
import re
import os

urls_034motorsport = [
    'https://www.034motorsport.com/audi/a3/8v/2-0-tfsi.html',
    'https://www.034motorsport.com/audi/s3/8v/2-0-tfsi.html',
    'https://www.034motorsport.com/volkswagen/golf-gti-rabbit/mkvii/2-0t-gen3.html',
    'https://www.034motorsport.com/volkswagen/r/mkvii-golf-r.html',
]

urls_performancebyie = [
    'https://performancebyie.com/collections/all/8V-S3',
    'https://performancebyie.com/collections/all/8V-A3',
    'https://performancebyie.com/collections/all/MK7-R',
    'https://performancebyie.com/collections/all/MK7-GTI',
]

ACCEPTABLE_MANUFACTURERS = [
    "034Motorsport",
    "RacingLine",
    "CSF",
    "AWE",
    "Brisk",
    "OEM",
    "Deatschwerks",
    "Wavetrac",
    "Sachs",
    "BERU",
    "Supertech",
    "Bilstein",
    "Wagner",
    "ARP",
    "Garrett",
    "IE",
]

CATEGORY_KEYWORDS = {
    "Downpipes": ["Downpipe"],
    "Tunes": ["Tune", "Software", "ECU Upgrade", "TCU Upgrade", "Flashing"],
    "Wheels": ["Wheel", "Forged", "Flowform"],
    "Brake Parts": ["Brake", "Rotor", "Pad", "Caliper", "Big Brake Kit"],
    "Intakes": ["Intake", "Air Intake", "Cold Air Intake", "Insuction Bundle", "Airbox", "Air Filter"],
    "Turbochargers": ["Turbo", "Turbocharger", "Hybrid Turbo", "Turbo Inlet", "Turbo Muffler Delete"],
    "Engine build parts": ["Piston", "Rod", "Connecting Rod", "Valve", "Valve Spring", "Camshaft", "Engine Build", "Internal"],
    "Suspension parts": ["Suspension", "Springs", "Lowering Springs", "Coilover", "Sway Bar", "End Link", "Control Arm", "Trailing Arm", "Toe Link", "Mount", "Insert", "Bushings", "Strut", "Shock", "Camber Plate", "Subframe", "Brace"],
    "Exhaust Systems" : ["Catback", "Exhaust System"],
}

all_products_034motorsport = []
all_products_performancebyie = []

def scrape_product_list_page(url, pagination_param):
    print(f"Attempting to fetch: {url}")
    products_on_page = []
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/534.36'}
        response = requests.get(url, headers=headers)

        response.raise_for_status()

        html_content = response.text

        print(f"Successfully fetched content from: {url}")

        soup = BeautifulSoup(html_content, 'html.parser')

        if '034motorsport.com' in url:
             product_items = soup.select('li.product-item')
        elif 'performancebyie.com' in url:
             product_items = soup.select('.grid-product')

        if not product_items:
            print(f"No product items found on {url} with the current selector.")
            print("This might be the last page or you may need to inspect the website's HTML to find the correct product item selector.")
            return []

        print(f"Found {len(product_items)} potential product items.")

        for item in product_items:
            if '034motorsport.com' in url:
                name_link_tag = item.select_one('a.product-item-link')
                price_tag = item.select_one('span.price')
            elif 'performancebyie.com' in url:
                 name_link_tag = item.select_one('.grid-product__link')
                 price_tag = item.select_one('.grid-product__price')

            product_name = name_link_tag.get_text(strip=True) if name_link_tag else 'N/A'
            product_url = name_link_tag.get('href') if name_link_tag else 'N/A'
            if product_url and product_url.startswith('/'):
                 product_url = urllib.parse.urljoin(url, product_url)

            product_price = price_tag.get_text(strip=True) if price_tag else 'N/A'

            products_on_page.append({
                'name': product_name,
                'price': product_price,
                'url': product_url,
                'source_url': url
            })

        return products_on_page

    except requests.exceptions.RequestException as e:
        print(f"Error fetching the URL {url}: {e}")
        return []
    except Exception as e:
        print(f"An error occurred while processing {url}: {e}")
        return []

def determine_category(product_name):
    category = "Miscellaneous"
    name_upper = product_name.upper()

    if any(keyword.upper() in name_upper for keyword in CATEGORY_KEYWORDS["Downpipes"]):
        category = "Downpipes"
    elif any(keyword.upper() in name_upper for keyword in CATEGORY_KEYWORDS["Tunes"]):
        category = "Tunes"
    elif any(keyword.upper() in name_upper for keyword in CATEGORY_KEYWORDS["Wheels"]):
        category = "Wheels"
    elif any(keyword.upper() in name_upper for keyword in CATEGORY_KEYWORDS["Brake Parts"]):
        category = "Brake Parts"
    elif any(keyword.upper() in name_upper for keyword in CATEGORY_KEYWORDS["Intakes"]):
        category = "Intakes"
    elif any(keyword.upper() in name_upper for keyword in CATEGORY_KEYWORDS["Turbochargers"]):
        category = "Turbochargers"
    elif any(keyword.upper() in name_upper for keyword in CATEGORY_KEYWORDS["Engine build parts"]):
        category = "Engine build parts"
    elif any(keyword.upper() in name_upper for keyword in CATEGORY_KEYWORDS["Suspension parts"]):
        category = "Suspension parts"
    elif any(keyword.upper() in name_upper for keyword in CATEGORY_KEYWORDS["Exhaust Systems"]):
        category = "Exhaust Systems"

    return category

def process_products(product_list):
    processed_products = []
    seen_urls = set()

    for product in product_list:
        product_name = product['name']
        product_url = product['url']
        source_url = product['source_url']

        if product_url in seen_urls:
            continue

        seen_urls.add(product_url)

        rated_index = product_name.lower().find("rated")
        if rated_index != -1:
            product_name_cleaned = product_name[:rated_index].strip()
        else:
            product_name_cleaned = product_name.strip()

        price_pattern = r'\$\s*\d+(\.\d{2})?|\£\s*\d+(\.\d{2})?'
        product_name_cleaned = re.sub(price_pattern, '', product_name_cleaned).strip()

        product_name_cleaned = re.sub(r'[\s-]+$', '', product_name_cleaned)

        model_designator = "VW MQB"
        name_upper = product_name_cleaned.upper()
        if "FWD" in name_upper:
            model_designator = "VW MQB FWD"
        elif "AWD" in name_upper:
            model_designator = "VW MQB AWD"

        default_manufacturer = "034Motorsport"
        if 'performancebyie.com' in source_url:
            default_manufacturer = "IE"

        manufacturer = default_manufacturer
        extracted_manufacturer = None

        for acceptable_mfg in ACCEPTABLE_MANUFACTURERS:
            pattern = r'^' + re.escape(acceptable_mfg) + r'\s+-\s+'
            match = re.match(pattern, product_name_cleaned, re.IGNORECASE)
            if match:
                extracted_manufacturer = acceptable_mfg
                break

        if extracted_manufacturer:
            manufacturer = extracted_manufacturer
        else:
            first_word = product_name_cleaned.split(' ')[0]
            if first_word.lower() in [mfg.lower() for mfg in ACCEPTABLE_MANUFACTURERS]:
                 for acceptable_mfg in ACCEPTABLE_MANUFACTURERS:
                     if first_word.lower() == acceptable_mfg.lower():
                         manufacturer = acceptable_mfg
                         break

        category = determine_category(product_name_cleaned)

        processed_products.append({
            'model_designator': model_designator,
            'manufacturer': manufacturer,
            'name': product_name_cleaned,
            'price': product['price'],
            'url': product_url,
            'category': category
        })

    return processed_products

print("\n--- Scraping 034Motorsport ---")
for base_url in urls_034motorsport:
    page_num = 1
    while True:
        if page_num == 1:
            current_url = base_url
        else:
            parsed_url = urllib.parse.urlparse(base_url)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            query_params['p'] = [str(page_num)]
            encoded_query = urllib.parse.urlencode(query_params, doseq=True)
            current_url = parsed_url._replace(query=encoded_query).geturl()

        products_from_url = scrape_product_list_page(current_url, pagination_param='p')

        if products_from_url:
            all_products_034motorsport.extend(products_from_url)
            page_num += 1
            time.sleep(2)
        else:
            print(f"No more products found on page {page_num} for {base_url}. Stopping pagination.")
            break

print("\n--- Scraping PerformanceByIE ---")
for base_url in urls_performancebyie:
    page_num = 1
    while True:
        if page_num == 1:
            current_url = base_url
        else:
            parsed_url = urllib.parse.urlparse(base_url)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            query_params['page'] = [str(page_num)]
            encoded_query = urllib.parse.urlencode(query_params, doseq=True)
            current_url = parsed_url._replace(query=encoded_query).geturl()

        products_from_url = scrape_product_list_page(current_url, pagination_param='page')

        if products_from_url:
            all_products_performancebyie.extend(products_from_url)
            page_num += 1
            time.sleep(2)
        else:
            print(f"No more products found on page {page_num} for {base_url}. Stopping pagination.")
            break

all_scraped_products = all_products_034motorsport + all_products_performancebyie

print("\n--- Processing All Scraped Products ---")
processed_all_products = process_products(all_scraped_products)
print(f"\nTotal unique processed products found across both websites: {len(processed_all_products)}")

def save_to_csv(filename, data):
    if not data:
        print(f"\nNo data to save to {filename}.")
        return

    output_folder = "output"
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    filepath = os.path.join(output_folder, filename)

    try:
        fieldnames = ['model_designator', 'manufacturer', 'name', 'price', 'url', 'category']

        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            writer.writeheader()
            for product in data:
                writer.writerow(product)
        print(f"\nProduct data saved to {filepath}")
    except IOError as e:
        print(f"Error saving data to {filepath}: {e}")

save_to_csv('mqb_parts_combined_categorized.csv', processed_all_products)
