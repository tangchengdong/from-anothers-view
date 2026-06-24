import hashlib
import random
from typing import List, Dict, Any
from .base import BaseAgent

_PRISM_COLORS = ["#FF6B9D", "#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#F59E0B", "#EC4899", "#6366F1"]

_PERSPECTIVE_TEMPLATES = {
    "菜市场小贩": {
        "emoji": "🧅",
        "keywords": ["物价", "生鲜", "菜价", "生意", "街坊", "成本", "进货", "涨价", "民生"],
        "headline": "菜市场小贩：「{query}」在菜篮子里是什么价？",
        "viewpoint": "从菜市场小贩的角度看「{query}」，最先算的是一笔账：这东西进货价多少？能卖出多少？街坊们买不买账？再大的新闻，最终都要落到老百姓的菜篮子里。小贩不关心宏大叙事，只关心「{query}」会不会让明天的青菜涨五毛。",
        "tags": ["{query}", "市井视角", "民生温度", "菜篮子"],
    },
    "深海生物学家": {
        "emoji": "🐙",
        "keywords": ["海洋", "生物", "深海", "珊瑚", "生态", "物种", "环保", "进化", "多样性"],
        "headline": "深海生物学家：「{query}」在深海折射出什么？",
        "viewpoint": "深海生物学家看「{query}」会追问：这件事对海洋生态有什么影响？人类活动是否在改变深海环境？在千米之下的黑暗世界，生命以我们无法想象的方式存在，「{query}」的连锁反应可能波及那些我们从未见过的生灵。",
        "tags": ["{query}", "深海视角", "生态思维", "生命多样性"],
    },
    "唐代诗人": {
        "emoji": "📜",
        "keywords": ["诗意", "山水", "人文", "历史", "情怀", "风雅", "时代", "诗", "意境"],
        "headline": "唐代诗人：若为「{query}」赋一诗",
        "viewpoint": "唐代诗人遇见「{query}」，会先沉吟片刻，然后把酒临风。大喜大悲皆可入诗，世事变迁不过是新的题材。诗人不评判对错，只捕捉「{query}」中那一瞬间的意境——是「大漠孤烟直」的壮阔，还是「落花人独立」的惆怅。",
        "tags": ["{query}", "诗意视角", "人文情怀", "古今对话"],
    },
    "火星殖民者": {
        "emoji": "🚀",
        "keywords": ["太空", "火星", "殖民", "科技", "未来", "生存", "探索", "移民", "星际"],
        "headline": "火星殖民者：「{query}」在火星上还重要吗？",
        "viewpoint": "站在火星红色的荒原上回望地球，「{query}」变得既渺小又珍贵。殖民者会问：如果人类要成为多星球物种，「{query}」所代表的人类文明特质，哪些值得带到火星？哪些应该留在地球？在生存面前，一切浮华都会褪去。",
        "tags": ["{query}", "未来视角", "星际思维", "文明思考"],
    },
    "幼儿园小朋友": {
        "emoji": "🧒",
        "keywords": ["好奇", "为什么", "简单", "快乐", "玩耍", "朋友", "颜色", "天真", "想象"],
        "headline": "小朋友：「{query}」是什么呀？为什么呀？",
        "viewpoint": "幼儿园小朋友看「{query}」会歪着头问：这是什么呀？为什么要这样呀？它好玩吗？可以吃吗？小朋友的问题看似简单，却常常直击本质。在大人复杂的解释和争论中，小朋友只想知道「{query}」跟我有什么关系？是开心的事吗？",
        "tags": ["{query}", "童稚视角", "返璞归真", "初心追问"],
    },
    "出租车司机": {
        "emoji": "🚕",
        "keywords": ["路况", "交通", "城市", "乘客", "油价", "拥堵", "八卦", "路线", "生活"],
        "headline": "出租车司机：「{query}」这事儿，我拉的客人都聊过",
        "viewpoint": "出租车司机听过这座城市最杂的声音。「{query}」一出来，车上的话题自然就拐过去了。有人骂街，有人叫好，有人叹气，有人沉默。司机不站队，只是从后视镜里看着这座城市的情绪起伏——油价涨了大家骂，路堵了大家急，这就是日子。",
        "tags": ["{query}", "的哥视角", "城市脉搏", "民间声音"],
    },
    "流浪猫": {
        "emoji": "🐱",
        "keywords": ["生存", "流浪", "温暖", "食物", "人类", "街头", "自由", "领地", "夜晚"],
        "headline": "流浪猫：「{query}」和今天的罐头有关系吗",
        "viewpoint": "流浪猫对「{query}」的兴趣持续不到三秒——除非它能带来食物或温暖。猫的世界很简单：哪里有阳光，哪里有吃的，哪里可以安全地睡觉。人类折腾的那些大事，在猫眼里还不如一个被风吹动的塑料袋有意思。但如果「{query}」让街道更冷、食物更少，猫会第一个知道。",
        "tags": ["{query}", "猫视角", "简单生存", "冷眼旁观"],
    },
    "量子物理学家": {
        "emoji": "⚛️",
        "keywords": ["量子", "物理", "宇宙", "概率", "纠缠", "科学", "本质", "观测", "叠加态"],
        "headline": "量子物理学家：「{query}」的观测者效应",
        "viewpoint": "量子物理学家看「{query}」会想到观测者效应——当我们关注一件事时，它本身就在改变。在量子世界，没有绝对的因果，只有概率分布和纠缠关系。「{query}」看似确定的表象下，可能藏着无数个叠加态的可能性，关键是你选择如何观测。",
        "tags": ["{query}", "量子视角", "概率思维", "观测者效应"],
    },
    "外卖骑手": {
        "emoji": "🛵",
        "keywords": ["配送", "算法", "超时", "风雨", "收入", "路线", "辛苦", "订单", "奔波"],
        "headline": "外卖骑手：「{query}」能让路上少跑两单吗？",
        "viewpoint": "外卖骑手看「{query}」最关心的是：这会影响我接单吗？会让超时罚款更多吗？电梯会不会更难等？算法给的时间本来就紧，风吹日晒已经够辛苦了。「{query}」如果是好消息，那就是今天能多赚几块；如果是坏消息，无非是路上再多加一把油门。",
        "tags": ["{query}", "骑手视角", "算法之下", "奔跑人生"],
    },
    "AI研究员": {
        "emoji": "🤖",
        "keywords": ["AI", "大模型", "对齐", "AGI", "训练", "推理", "智能", "神经网络", "涌现"],
        "headline": "AI研究员：「{query}」的模式与涌现",
        "viewpoint": "AI研究员看「{query}」会本能地寻找模式：这背后的数据分布是什么？反馈回路如何形成？是否会出现涌现行为？在模型里，千亿参数的交织能产生意想不到的能力；在人间，亿万人的互动同样涌现出「{query}」这样的复杂现象。理解它，需要超越直觉的系统思维。",
        "tags": ["{query}", "AI视角", "模式识别", "涌现思维"],
    },
    "侦探": {
        "emoji": "🔍",
        "keywords": ["线索", "推理", "真相", "嫌疑", "证据", "逻辑", "破案", "动机", "痕迹"],
        "headline": "侦探：关于「{query}」的三个关键线索",
        "viewpoint": "侦探面对「{query}」会先问三个问题：谁受益了？谁在说谎？证据链完整吗？真相往往藏在被忽略的细节里——一个矛盾的时间点，一笔可疑的转账，一个过于完美的说辞。「{query}」看起来再简单，也要用证据说话，排除所有不可能，剩下的就是真相。",
        "tags": ["{query}", "侦探视角", "逻辑推理", "真相追寻"],
    },
    "宇航员": {
        "emoji": "👨‍🚀",
        "keywords": ["太空", "地球", "失重", "星空", "出舱", "俯瞰", "浩瀚", "宇宙", "蓝色星球"],
        "headline": "宇航员：从太空俯瞰「{query}」",
        "viewpoint": "从空间站俯瞰地球，看不到国界，看不到纷争，只能看到一颗蓝色的星球安静地悬浮在黑色太空中。「{query}」在地面上惊天动地，在宇宙尺度上却连一个像素都不到。但正是这颗星球上发生的一切，让宇航员出舱时会觉得：人类虽然渺小，但我们做的每一件事都在改变这颗蓝点。",
        "tags": ["{query}", "太空视角", "俯瞰人间", "蓝点感悟"],
    },
    "心理咨询师": {
        "emoji": "🛋️",
        "keywords": ["心理", "情绪", "倾听", "疗愈", "创伤", "成长", "内心", "防御机制", "共情"],
        "headline": "心理咨询师：「{query}」背后的情绪是什么",
        "viewpoint": "心理咨询师看「{query}」不看表面对错，而是感受背后的情绪：是恐惧？是愤怒？是渴望被看见？人们对「{query}」的强烈反应，往往不是因为事件本身，而是它触动了内心深处未被处理的部分。先理解情绪，才能理解行为。",
        "tags": ["{query}", "心理视角", "情绪共情", "深层动机"],
    },
    "LGBTQ权益活动家": {
        "emoji": "🌈",
        "keywords": ["平权", "多元", "包容", "歧视", "婚姻", "身份", "骄傲", "出柜", "平等"],
        "headline": "酷儿视角：「{query}」中的平等与多元",
        "viewpoint": "从酷儿视角看「{query}」，要问：这件事是否让少数群体更加边缘化？有没有人被排除在讨论之外？平等不是多数人的施舍，而是每个人都能被看见。「{query}」如果只讲述了主流群体的故事，那它就不完整——真正的进步，是让最边缘的声音也被听到。",
        "tags": ["{query}", "酷儿视角", "平权思维", "多元包容"],
    },
    "环保主义者": {
        "emoji": "🌱",
        "keywords": ["环保", "生态", "可持续", "低碳", "污染", "保护", "未来", "气候", "绿色"],
        "headline": "环保主义者：「{query}」留给下一代什么",
        "viewpoint": "环保主义者看「{query}」会追问代价：这件事的环境成本是什么？碳足迹有多大？资源消耗可不可持续？短期的便利和增长，不能以透支地球为代价。「{query}」如果只算经济账不算生态账，那这笔账迟早要还——而且要由我们的孩子来还。",
        "tags": ["{query}", "环保视角", "可持续思维", "代际责任"],
    },
}

_GENERIC_KEYWORDS = [
    "热点", "趋势", "变化", "影响", "生活", "社会", "发展", "未来", "人们", "关注",
]

_GENERIC_TEMPLATES = [
    {
        "headline": "{role}：「{query}」意味着什么",
        "viewpoint": "从{role}的角度看「{query}」，会有不一样的发现。每个身份都有自己的关注点和价值判断，{role}会追问：这件事对我们意味着什么？该如何应对？跳出自己的信息茧房，听听{role}的声音，才能看到更完整的世界。",
        "tags": ["{query}", "{role}视角", "多元解读", "破茧思考"],
    },
    {
        "headline": "{role}怎么看「{query}」",
        "viewpoint": "{role}解读「{query}」的方式和大众不同。他们有自己的生活经验和价值取向，会从独特的切入点剖析事件。理解{role}对「{query}」的看法，就是打破信息茧房、拥抱多元视角的重要一步。看见不同，才能理解世界的丰富。",
        "tags": ["{query}", "{role}视角", "跨界思考", "信息破茧"],
    },
]


class DynamicAgent(BaseAgent):

    def __init__(self, perspective_name: str, role_data: Dict = None):
        self.perspective_id = f"dyn_{hashlib.md5(perspective_name.encode()).hexdigest()[:8]}"
        self.role_name = perspective_name
        self.system_prompt = f"你是一位{perspective_name}，从该视角解读资讯，提供独到、有洞察力的观点。"
        self._perspective_name = perspective_name
        self._role_data = role_data
        self._template = self._match_template(perspective_name)

        if role_data:
            self.interest_keywords = role_data.get("keywords", self._build_keywords(perspective_name))
            self.preferred_categories = []
            self._emoji = role_data.get("emoji", self._template.get("emoji", "🔍") if self._template else "🔍")
            self._color = role_data.get("color", self._pick_color(perspective_name))
            self._description = role_data.get("description", "")
        elif self._template:
            self.interest_keywords = self._template.get("keywords", self._build_keywords(perspective_name))
            self.preferred_categories = []
            self._emoji = self._template["emoji"]
            self._color = self._pick_color(perspective_name)
            self._description = ""
        else:
            self.interest_keywords = self._build_keywords(perspective_name)
            self.preferred_categories = []
            self._emoji = "🔍"
            self._color = self._pick_color(perspective_name)
            self._description = ""

        self._thinking_steps = [
            f"{perspective_name}正在浏览资讯池...",
            f"{perspective_name}在筛选感兴趣的话题...",
            f"{perspective_name}在评估内容质量...",
            f"{perspective_name}正在整理推荐列表...",
        ]

    def _build_keywords(self, name: str) -> List[str]:
        """为未知角色构建关键词：角色名分词 + 通用高频词兜底"""
        kws = [name]
        for ch in name:
            if '\u4e00' <= ch <= '\u9fff':
                kws.append(ch)
        kws.extend(_GENERIC_KEYWORDS[:5])
        return list(set(kws))

    def _match_template(self, name: str) -> Dict:
        """模糊匹配预设模板：支持部分匹配"""
        if name in _PERSPECTIVE_TEMPLATES:
            return _PERSPECTIVE_TEMPLATES[name]
        for key, tpl in _PERSPECTIVE_TEMPLATES.items():
            if key in name or name in key:
                return tpl
        for key, tpl in _PERSPECTIVE_TEMPLATES.items():
            for kw in tpl.get("keywords", []):
                if kw in name or name in kw:
                    return tpl
        return None

    def _pick_color(self, name: str) -> str:
        h = int(hashlib.md5(name.encode()).hexdigest(), 16)
        return _PRISM_COLORS[h % len(_PRISM_COLORS)]

    def _get_emoji(self) -> str:
        return self._emoji

    def _get_color(self) -> str:
        return self._color

    def _generate_headline(self, query: str) -> str:
        if self._template:
            return self._template["headline"].format(query=query, role=self._perspective_name)
        tpl = _GENERIC_TEMPLATES[0]
        return tpl["headline"].format(query=query, role=self._perspective_name)

    def _generate_viewpoint(self, query: str) -> str:
        if self._template:
            return self._template["viewpoint"].format(query=query, role=self._perspective_name)
        h = int(hashlib.md5(self._perspective_name.encode()).hexdigest(), 16)
        tpl = _GENERIC_TEMPLATES[h % len(_GENERIC_TEMPLATES)]
        return tpl["viewpoint"].format(query=query, role=self._perspective_name)

    def _generate_tags(self, query: str) -> List[str]:
        if self._template:
            return [t.format(query=query, role=self._perspective_name) for t in self._template["tags"]]
        tpl = _GENERIC_TEMPLATES[0]
        return [t.format(query=query, role=self._perspective_name) for t in tpl["tags"]]

    def generate_commentary(self, query: str) -> Dict[str, Any]:
        result = super().generate_commentary(query)
        result["is_custom"] = True
        result["custom_name"] = self._perspective_name
        if self._description:
            result["description"] = self._description
        return result
