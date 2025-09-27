import mysql.connector
import json
import os

# --- Config ---
DB_NAME = "portfolio_analyzer"
USER = "taskmanager"
PASSWORD = "user1234"
HOST = "localhost"

JSON_FILE = "ClientPortfolio.json"  # make sure this is in the same folder

# --- Connect to MySQL without database first ---
conn = mysql.connector.connect(
    host=HOST,
    user=USER,
    password=PASSWORD
)
cursor = conn.cursor()

# --- Create database if not exists ---
cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
cursor.execute(f"USE {DB_NAME}")

# --- Create tables ---
cursor.execute("""
CREATE TABLE IF NOT EXISTS clients (
    clientId VARCHAR(20) PRIMARY KEY,
    currency VARCHAR(10)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS funds (
    fundId INT AUTO_INCREMENT PRIMARY KEY,
    clientId VARCHAR(20),
    fundCode VARCHAR(50),
    amount DOUBLE,
    FOREIGN KEY (clientId) REFERENCES clients(clientId)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS holdings (
    holdingId INT AUTO_INCREMENT PRIMARY KEY,
    fundId INT,
    stockSymbol VARCHAR(50),
    percent DOUBLE,
    FOREIGN KEY (fundId) REFERENCES funds(fundId)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS sectors (
    sectorId INT AUTO_INCREMENT PRIMARY KEY,
    fundId INT,
    sectorName VARCHAR(100),
    percent DOUBLE,
    FOREIGN KEY (fundId) REFERENCES funds(fundId)
)
""")

conn.commit()

# --- Load JSON ---
with open(JSON_FILE, "r") as f:
    data = json.load(f)

# --- Insert data ---
for client in data:
    cursor.execute(
        "INSERT IGNORE INTO clients (clientId, currency) VALUES (%s, %s)",
        (client["clientId"], client["currency"])
    )
    conn.commit()
    
    for fund in client["funds"]:
        cursor.execute(
            "INSERT INTO funds (clientId, fundCode, amount) VALUES (%s, %s, %s)",
            (client["clientId"], fund["fundCode"], fund["amount"])
        )
        fund_id = cursor.lastrowid
        
        for stock, pct in fund["holdings"].items():
            cursor.execute(
                "INSERT INTO holdings (fundId, stockSymbol, percent) VALUES (%s, %s, %s)",
                (fund_id, stock, pct*100)  # store as %
            )
        
        for sector, pct in fund["sectors"].items():
            cursor.execute(
                "INSERT INTO sectors (fundId, sectorName, percent) VALUES (%s, %s, %s)",
                (fund_id, sector, pct*100)  # store as %
            )
        conn.commit()

print("Portfolio data inserted successfully!")
cursor.close()
conn.close()
