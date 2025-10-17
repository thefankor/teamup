import enum


class UserRole(enum.Enum):
    CLIENT = "CLIENT"
    PSYCHOLOGIST = "PSYCHOLOGIST"
    ADMIN = "ADMIN"


class UserGender(enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"


class UserTimezone(enum.Enum):
    UTC_12_M = "UTC_12_M"
    UTC_11_M = "UTC_11_M"
    UTC_10_M = "UTC_10_M"
    UTC_9_M = "UTC_9_M"
    UTC_8_M = "UTC_8_M"
    UTC_7_M = "UTC_7_M"
    UTC_6_M = "UTC_6_M"
    UTC_5_M = "UTC_5_M"
    UTC_4_M = "UTC_4_M"
    UTC_3_M = "UTC_3_M"
    UTC_2_M = "UTC_2_M"
    UTC_1_M = "UTC_1_M"
    UTC = "UTC"
    UTC_1_P = "UTC_1_P"
    UTC_2_P = "UTC_2_P"
    UTC_3_P = "UTC_3_P"
    UTC_4_P = "UTC_4_P"
    UTC_5_P = "UTC_5_P"
    UTC_6_P = "UTC_6_P"
    UTC_7_P = "UTC_7_P"
    UTC_8_P = "UTC_8_P"
    UTC_9_P = "UTC_9_P"
    UTC_10_P = "UTC_10_P"
    UTC_11_P = "UTC_11_P"
    UTC_12_P = "UTC_12_P"
    UTC_13_P = "UTC_13_P"
    UTC_14_P = "UTC_14_P"
