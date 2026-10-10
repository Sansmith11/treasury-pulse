import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_synthetic_transactions(num_records=50000, output_file="data/synthetic_transactions_50k.csv"):
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Reproducibility
    random.seed(42)
    np.random.seed(42)

    entities_config = [
        {"entity": "BNPPARIBAS_PARIS", "region": "EMEA", "country": "France", "city": "Paris", "base_curr": "EUR", "code": "FRPA"},
        {"entity": "BNPPARIBAS_FRANKFURT", "region": "EMEA", "country": "Germany", "city": "Frankfurt", "base_curr": "EUR", "code": "DEFR"},
        {"entity": "BNPPARIBAS_LONDON", "region": "EMEA", "country": "United Kingdom", "city": "London", "base_curr": "GBP", "code": "GBLO"},
        {"entity": "BNPPARIBAS_NY", "region": "NAMER", "country": "United States", "city": "New York", "base_curr": "USD", "code": "USNY"},
        {"entity": "BNPPARIBAS_TOKYO", "region": "APAC", "country": "Japan", "city": "Tokyo", "base_curr": "JPY", "code": "JPTK"},
        {"entity": "BNPPARIBAS_SINGAPORE", "region": "APAC", "country": "Singapore", "city": "Singapore", "base_curr": "SGD", "code": "SGSG"},
        {"entity": "BNPPARIBAS_MUMBAI", "region": "APAC", "country": "India", "city": "Mumbai", "base_curr": "INR", "code": "INMU"},
        {"entity": "BNPPARIBAS_HK", "region": "APAC", "country": "Hong Kong", "city": "Hong Kong", "base_curr": "HKD", "code": "HKHK"}
    ]

    all_currencies = ["USD", "EUR", "GBP", "JPY", "SGD", "INR", "HKD", "CHF", "CAD", "AUD"]
    fx_to_usd = {
        "USD": 1.0,
        "EUR": 1.09,
        "GBP": 1.28,
        "JPY": 0.0067,
        "SGD": 0.75,
        "INR": 0.012,
        "HKD": 0.128,
        "CHF": 1.13,
        "CAD": 0.74,
        "AUD": 0.66
    }

    account_types = ["Operating", "Payroll", "Treasury", "Tax", "Escrow", "Debt Service"]
    departments = ["Corporate Treasury", "Global Markets", "Procurement", "Human Resources", "Operations", "Finance & Tax"]
    counterparties_by_rating = {
        "A": ["Microsoft Corp", "Apple Inc", "TotalEnergies SE", "Siemens AG", "BNP Paribas Internal", "Sony Corp", "Federal Reserve", "ECB", "Bank of England"],
        "B": ["Airbus SE", "Schneider Electric", "Tata Consultancy Services", "DBS Bank", "Toyota Motor", "Barclays PLC", "Allianz SE"],
        "C": ["Global Logistics Ltd", "Apex Tech Partners", "Meridian Maritime", "Oceanic Shipping", "Vanguard Metal Traders"],
        "D": ["Orion Subcontractors", "CrossBorder Retailers Inc", "Delta Horizons LLC", "Pacific Ventures Ltd"]
    }
    
    product_categories = [
        {"product": "Customer Receipt", "direction": "Inflow", "category": "Operating", "weight": 0.40},
        {"product": "Treasury Loan", "direction": "Inflow", "category": "Financing", "weight": 0.06},
        {"product": "Investment Return", "direction": "Inflow", "category": "Investing", "weight": 0.06},
        {"product": "FX Trade Receipt", "direction": "Inflow", "category": "Financing", "weight": 0.06},
        {"product": "Supplier Payment", "direction": "Outflow", "category": "Operating", "weight": 0.22},
        {"product": "Payroll", "direction": "Outflow", "category": "Operating", "weight": 0.08},
        {"product": "Tax", "direction": "Outflow", "category": "Operating", "weight": 0.04},
        {"product": "Capex", "direction": "Outflow", "category": "Investing", "weight": 0.04},
        {"product": "Commercial Loan Repayment", "direction": "Outflow", "category": "Financing", "weight": 0.04}
    ]
    product_weights = [p["weight"] for p in product_categories]

    payment_methods = ["SWIFT", "SEPA", "Fedwire", "ACH", "CHAPS"]
    frequencies = ["Daily", "Weekly", "Monthly", "Ad-hoc"]
    
    # 12-month span: 2025-10-01 to 2026-09-30 (or roughly past 365 days)
    end_date = datetime(2026, 10, 10)
    start_date = end_date - timedelta(days=365)
    total_days = 365

    records = []
    
    print(f"Generating {num_records} synthetic transactions across 8 entities and 10+ currencies...")

    # Assign persistent accounts for each entity
    accounts_by_entity = {}
    for ent in entities_config:
        accounts_by_entity[ent["entity"]] = [
            f"ACT-{ent['code']}-{1000 + i}" for i in range(len(account_types))
        ]

    for i in range(num_records):
        txn_id = f"TXN-{1000000 + i}"
        
        # Entity selection
        ent = random.choice(entities_config)
        entity_name = ent["entity"]
        region = ent["region"]
        country = ent["country"]
        city = ent["city"]
        base_curr = ent["base_curr"]
        entity_code = ent["code"]

        # Date with weekday bias (financial markets closed on weekends have fewer transactions)
        day_offset = random.randint(0, total_days)
        txn_datetime = start_date + timedelta(days=day_offset, hours=random.randint(8, 18), minutes=random.randint(0, 59))
        
        # Weekend adjustment: shift 70% of weekend txns to nearest Friday or Monday
        if txn_datetime.weekday() in [5, 6] and random.random() < 0.75:
            txn_datetime = txn_datetime - timedelta(days=(1 if txn_datetime.weekday() == 5 else 2))
            
        txn_date_str = txn_datetime.strftime("%Y-%m-%d")

        # Account
        act_idx = random.randint(0, len(account_types) - 1)
        account_type = account_types[act_idx]
        account_number = accounts_by_entity[entity_name][act_idx]

        # Product selection
        prod = random.choices(product_categories, weights=product_weights, k=1)[0]
        product_type = prod["product"]
        direction = prod["direction"]
        category = prod["category"]

        # Counterparty risk
        rating = random.choices(["A", "B", "C", "D"], weights=[0.55, 0.28, 0.12, 0.05], k=1)[0]
        counterparty = random.choice(counterparties_by_rating[rating])

        # Cross border & currencies
        is_cross_border = random.random() < 0.35
        if is_cross_border:
            destination_curr = random.choice(all_currencies)
            origin_curr = base_curr
        else:
            origin_curr = base_curr
            destination_curr = base_curr

        # FX rate relative to destination
        fx_orig = fx_to_usd.get(origin_curr, 1.0)
        fx_dest = fx_to_usd.get(destination_curr, 1.0)
        rate = round(fx_orig / fx_dest * random.uniform(0.985, 1.015), 4)

        # Realistic Amount distribution based on product type
        if product_type in ["Capex", "Treasury Loan", "Commercial Loan Repayment"]:
            # Large enterprise transfers
            amt_usd = np.random.lognormal(mean=12.2, sigma=1.0)  # ~$150k to $3M
        elif product_type in ["Payroll", "Tax"]:
            amt_usd = np.random.lognormal(mean=11.0, sigma=0.8)  # ~$40k to $300k
        elif product_type in ["Deposit", "Investment Return"]:
            amt_usd = np.random.lognormal(mean=11.5, sigma=0.9)  # ~$80k to $800k
        elif product_type == "Customer Receipt":
            amt_usd = np.random.lognormal(mean=10.8, sigma=1.0)  # ~$30k to $400k
        else:
            # Supplier, FX, etc.
            amt_usd = np.random.lognormal(mean=10.0, sigma=1.0)  # ~$10k to $150k

        # Scale amount to base currency
        curr_mult = 1.0 / fx_to_usd.get(base_curr, 1.0)
        original_amount = round(float(amt_usd * curr_mult), 2)
        
        # JPY and INR adjustments for realistic non-decimal units
        if base_curr in ["JPY", "INR"]:
            original_amount = round(original_amount, 0)

        # Recurrence & Frequency
        is_recurring = product_type in ["Payroll", "Tax", "Commercial Loan Repayment", "Treasury Loan"] or (random.random() < 0.25)
        if is_recurring:
            frequency = "Monthly" if product_type in ["Payroll", "Tax"] else random.choice(["Weekly", "Monthly"])
        else:
            frequency = "Ad-hoc"

        payment_method = random.choice(payment_methods)
        dept = random.choice(departments)

        # Due date and settlement status
        # If transaction date is in future relative to today, settlement is Pending/Scheduled
        if txn_datetime > datetime.now():
            settlement_status = random.choice(["Pending", "Scheduled"])
            due_date = (txn_datetime + timedelta(days=random.randint(1, 14))).strftime("%Y-%m-%d")
        else:
            # In past: 94% settled, 4% pending, 2% scheduled
            settlement_status = random.choices(["Settled", "Pending", "Scheduled"], weights=[0.94, 0.04, 0.02], k=1)[0]
            if settlement_status == "Settled":
                due_date = txn_date_str
            else:
                due_date = (txn_datetime + timedelta(days=random.randint(1, 7))).strftime("%Y-%m-%d")

        # Maturity date for loans and deposits
        maturity_date = None
        if product_type in ["Treasury Loan", "Deposit", "Commercial Loan Repayment"]:
            mat_days = random.choice([30, 60, 90, 180, 365])
            maturity_date = (txn_datetime + timedelta(days=mat_days)).strftime("%Y-%m-%d")

        records.append({
            "transaction_id": txn_id,
            "transaction_date": txn_date_str,
            "Entity": entity_name,
            "Region": region,
            "Country": country,
            "City": city,
            "account_type": account_type,
            "account_number": account_number,
            "Currency": base_curr,
            "original_amount": original_amount,
            "Direction": direction,
            "product_type": product_type,
            "Category": category,
            "Frequency": frequency,
            "is_recurring": is_recurring,
            "payment_method": payment_method,
            "Counterparty": counterparty,
            "settlement_status": settlement_status,
            "due_date": due_date,
            "entity_code": entity_code,
            "Department": dept,
            "counterparty_risk_rating": rating,
            "origin_currency": origin_curr,
            "destination_currency": destination_curr,
            "is_cross_border": is_cross_border,
            "Fx_rate": rate,
            "maturity_date": maturity_date if maturity_date else ""
        })

    df = pd.DataFrame(records)
    # Sort chronologically
    df.sort_values(by=["transaction_date", "transaction_id"], inplace=True)
    df.reset_index(drop=True, inplace=True)
    df.to_csv(output_file, index=False)
    print(f"Dataset successfully created at {output_file} with {len(df)} rows and {len(df.columns)} columns.")
    return output_file

if __name__ == "__main__":
    generate_synthetic_transactions(50000, "data/synthetic_transactions_50k.csv")
