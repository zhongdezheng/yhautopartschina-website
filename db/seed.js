// Seed script: import existing products into D1
// Run: npx wrangler d1 execute yh-db --file=db/schema.sql
// Then run this via wrangler Pages Functions or manually

const seedProducts = [
  {
    id: "ea837-piston-ring",
    title: "德国原厂 EA837 3.0T 活塞环改进型",
    category: "活塞环",
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

// Generate SQL
const sql = seedProducts.map(p => {
  const features = JSON.stringify(p.features);
  const markets = JSON.stringify(p.marketFocus);
  return `INSERT OR REPLACE INTO products (id, title, category, compatible, features, image, market_focus) VALUES ('${p.id}', '${p.title.replace(/'/g, "''")}', '${p.category}', '${p.compatible.replace(/'/g, "''")}', '${features}', '${p.image}', '${markets}');`;
}).join('\n');

console.log(sql);
