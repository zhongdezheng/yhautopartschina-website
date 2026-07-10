export const pistons = [
  {
    id: "ea837-piston-ring",
    title: "德国原厂 EA837 3.0T 活塞环改进型",
    category: "活塞",
    compatible: "大众 / 奥迪全系列 / 途锐 3.0T / Q7 / 保时捷卡宴",
    features: ["一体环/分体环可选", "德国原厂正品", "拒绝副厂对比"],
    image: "/images/ea837.jpg",
    marketFocus: ["Southeast Asia", "Middle East"],
  },
  {
    id: "stihl-br600-piston",
    title: "进口斯蒂尔 STIHL BR600 吹风机活塞总成",
    category: "通用/油锯活塞",
    compatible: "斯蒂尔 BR600 机器及同款二冲程动力设备",
    features: ["原装拆机件/全新可选", "易损件高耐磨", "实物拍摄"],
    image: "/images/stihl_br600.jpg",
    marketFocus: ["Southeast Asia", "Africa"],
  },
  {
    id: "bmw-b48-b58-piston",
    title: "宝马 B38 / B48 / B58 / N20 / N52 活塞总成",
    category: "柴汽油机活塞",
    compatible: "宝马 3系 / 5系 / 7系 / X1 / X3 / X5 / X6 (520, 525, 730)",
    features: ["稳定耐用", "原厂品质保证", "带活塞销及卡簧"],
    image: "/images/bmw_pistons.jpg",
    marketFocus: ["Middle East", "Africa"],
  },
  {
    id: "suzuki-k14-piston",
    title: "昌河铃木 北斗星 K14 / 浪迪 / 福瑞达 1.4 活塞",
    category: "汽油机活塞",
    compatible: "铃木 K14 引擎 / 北斗星 / 浪迪 / 爱迪尔2",
    features: ["含活塞销与卡簧", "全新现货", "高性价比适配"],
    image: "/images/suzuki_k14.jpg",
    marketFocus: ["Southeast Asia", "Africa"],
  },
];

// Re-export: products is the combined array for search compatibility
import { pistonRings } from './pistonRings.js';
export const products = [...pistons, ...pistonRings];
export { pistonRings };

export const siteConfig = {
  brandName: "YH AUTO PARTS",
  tagline: "Your Trusted Auto Parts Partner Since 2002",
  whatsapp: "8618802074040",
  email: "info@yhautopartschina.com",
  supportedLanguages: [
    { code: "zh", label: "中文" },
    { code: "en", label: "EN" },
    { code: "ru", label: "Русский" },
    { code: "ar", label: "العربية" },
    { code: "vi", label: "Tiếng Việt" },
    { code: "th", label: "ไทย" },
  ],
  paymentMethods: [
    { name: "PayPal", icon: "paypal" },
    { name: "Western Union", icon: "western-union" },
    { name: "MoneyGram", icon: "moneygram" },
    { name: "T/T Transfer", icon: "tt" },
    { name: "M-Pesa", icon: "mpesa" },
    { name: "mada", icon: "mada" },
    { name: "GCash", icon: "gcash" },
  ],
  targetMarkets: [
    { value: "southeast-asia", label: "Southeast Asia" },
    { value: "middle-east", label: "Middle East" },
    { value: "africa", label: "Africa" },
  ],
};
