import mysql.connector
from mysql.connector import Error

def get_connection():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="taskmanager",
            password="user1234",
            database="stock_analyzer"
        )
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None
