import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    DEBUG = False
    TESTING = False
    
    MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
    MONGODB_DB_NAME = os.environ.get('MONGODB_DB_NAME', 'travel_planner')
    
    GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
    AMADEUS_API_KEY = os.environ.get('AMADEUS_API_KEY')
    AMADEUS_API_SECRET = os.environ.get('AMADEUS_API_SECRET')
    
    PORT = int(os.environ.get('PORT', 8089))
    HOST = os.environ.get('HOST', '0.0.0.0')

class DevelopmentConfig(Config):
    DEBUG = True
    ENV = 'development'

class ProductionConfig(Config):
    DEBUG = False
    ENV = 'production'

class TestingConfig(Config):
    TESTING = True
    DEBUG = True

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
