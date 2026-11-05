# -*- coding: utf-8 -*-
"""生成与后端 PasswordUtil 一致的 PBKDF2 密码哈希（用于 SQL 种子数据）。

格式：iterations$saltHex$hashHex
算法：PBKDF2WithHmacSHA256，迭代 10000 次，输出 32 字节。
用法：python tools/gen_password.py 123456 [saltHex]
"""
import hashlib
import secrets
import sys


def hash_password(password: str, salt_hex: str | None = None, iterations: int = 10000) -> str:
    salt_hex = salt_hex or secrets.token_hex(8)
    salt = bytes.fromhex(salt_hex)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations, 32)
    return f"{iterations}${salt_hex}${dk.hex()}"


if __name__ == "__main__":
    pwd = sys.argv[1] if len(sys.argv) > 1 else "123456"
    salt = sys.argv[2] if len(sys.argv) > 2 else None
    print(hash_password(pwd, salt))
