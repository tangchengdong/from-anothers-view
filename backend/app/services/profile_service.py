from typing import List, Dict, Any

INTEREST_TO_PERSPECTIVE = {
    "科技": "tech", "编程": "tech", "数码": "tech", "AI": "tech",
    "时尚": "female", "美妆": "female", "穿搭": "female",
    "游戏": "genz", "动漫": "genz", "二次元": "genz", "追星": "genz",
    "养生": "parent", "育儿": "parent", "教育": "parent",
    "自媒体": "creator", "写作": "creator", "运营": "creator",
    "美食": "lifestyle", "旅行": "lifestyle", "咖啡": "lifestyle",
    "环保": "environment", "可持续": "environment", "低碳": "environment",
    "LGBTQ": "lgbtq", "平权": "lgbtq", "多元": "lgbtq",
    "无障碍": "disability", "公益": "disability",
    "乡村": "rural", "农业": "rural", "三农": "rural",
    "养老": "elderly", "老年": "elderly",
    "国际": "global", "外交": "global", "跨文化": "global",
}

OCCUPATION_TO_PERSPECTIVE = {
    "程序员": "tech", "开发": "tech", "工程师": "tech", "产品经理": "tech",
    "设计师": "creator", "自媒体": "creator", "博主": "creator", "运营": "creator",
    "教师": "parent", "医生": "parent",
    "农民": "rural", "农业": "rural",
    "退休": "elderly",
}

CIRCLE_NAMES = {
    "female": "她视角", "genz": "Z世代", "parent": "父母辈",
    "creator": "创作者", "tech": "科技控", "lifestyle": "生活家",
    "lgbtq": "酷儿视角", "environment": "环保视角", "disability": "无障碍视角",
    "rural": "乡村视角", "elderly": "银发视角", "global": "国际视角",
}


def identify_user_circles(profile: Dict[str, Any]) -> List[str]:
    if not profile:
        return []

    circles = []

    age = profile.get("age", 0)
    if isinstance(age, (int, float)):
        if age < 25:
            circles.append("genz")
        elif age > 60:
            circles.append("elderly")
        elif 45 < age <= 60:
            circles.append("parent")

    gender = profile.get("gender", "")
    if gender == "female":
        circles.append("female")

    occupation = str(profile.get("occupation", ""))
    for keyword, pid in OCCUPATION_TO_PERSPECTIVE.items():
        if keyword in occupation:
            circles.append(pid)

    region = profile.get("region", "")
    if region in ["农村", "乡镇", "县城"]:
        circles.append("rural")

    ethnicity = profile.get("ethnicity", "")
    if ethnicity in ["亚裔", "黑人", "拉美裔", "中东", "混血", "原住民"]:
        circles.append("global")

    income = profile.get("income", "")
    if income == "低收入":
        circles.append("rural")

    education = profile.get("education", "")
    if education in ["硕士", "博士"]:
        circles.append("tech")

    interests = profile.get("interests", [])
    if isinstance(interests, list):
        for interest in interests:
            pid = INTEREST_TO_PERSPECTIVE.get(interest)
            if pid:
                circles.append(pid)

    return list(set(circles))


def get_circle_names(circles: List[str]) -> List[str]:
    return [CIRCLE_NAMES.get(c, c) for c in circles]


def get_filter_summary(
    original_count: int,
    filtered_count: int,
    user_circles: List[str],
) -> Dict[str, Any]:
    return {
        "original_count": original_count,
        "filtered_count": filtered_count,
        "shielded_count": 0,
        "user_circles": user_circles,
        "is_filtering": False,
    }
