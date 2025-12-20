import os
import logging
import sys
from datetime import datetime

LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG").upper()

LEVEL_MAP = {
    "VERBOSE": logging.DEBUG,
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL,
}

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        level = LEVEL_MAP.get(LOG_LEVEL, logging.DEBUG)
        logger.setLevel(level)
        
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)
        
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger

def log_request(logger: logging.Logger, method: str, path: str, body: dict = None):
    logger.debug(f"REQUEST: {method} {path}")
    if body:
        logger.debug(f"REQUEST BODY: {body}")

def log_response(logger: logging.Logger, status: int, body: dict = None):
    logger.debug(f"RESPONSE: status={status}")
    if body:
        logger.debug(f"RESPONSE BODY: {body}")

def log_error(logger: logging.Logger, error: Exception, context: str = ""):
    logger.error(f"ERROR {context}: {type(error).__name__}: {str(error)}")

def log_db_query(logger: logging.Logger, query: str, params: dict = None):
    logger.debug(f"DB QUERY: {query}")
    if params:
        logger.debug(f"DB PARAMS: {params}")
