import os
import pytest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def test_required_files_exist():
    expected_files = [
        "index.html",
        "app.js",
        "style.css",
        "firebase-config.js",
        "firebase-config.example.js",
        "LICENSE",
        "README.md"
    ]
    for filename in expected_files:
        path = os.path.join(ROOT_DIR, filename)
        assert os.path.isfile(path), f"Missing required file: {filename}"


def test_no_real_api_keys():
    config_path = os.path.join(ROOT_DIR, "firebase-config.js")
    with open(config_path, "r", encoding="utf-8") as f:
        content = f.read()
        assert "AIzaSy" not in content, "Real Firebase API key found in firebase-config.js"
        assert "saitaru-member-demo" not in content, "Real project ID found in firebase-config.js"
