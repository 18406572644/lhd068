import { INTERACTION_RISK } from './constants.js'

export const DRUG_INTERACTIONS = [
  {
    drugs: ['头孢', '酒精', '酒'],
    risk: INTERACTION_RISK.HIGH,
    title: '双硫仑样反应',
    description: '头孢类药物与酒精同服可引发双硫仑样反应，出现面部潮红、头痛、恶心、呕吐、心悸、呼吸困难等症状，严重者可危及生命。用药期间及停药后7天内禁止饮酒及含酒精的饮料、食物、药物。'
  },
  {
    drugs: ['甲硝唑', '酒精', '酒'],
    risk: INTERACTION_RISK.HIGH,
    title: '双硫仑样反应',
    description: '甲硝唑与酒精同服可引发双硫仑样反应，出现面部潮红、头痛、恶心、呕吐、心悸等症状。用药期间及停药后3天内禁止饮酒。'
  },
  {
    drugs: ['替硝唑', '酒精', '酒'],
    risk: INTERACTION_RISK.HIGH,
    title: '双硫仑样反应',
    description: '替硝唑与酒精同服可引发双硫仑样反应。用药期间及停药后3天内禁止饮酒。'
  },
  {
    drugs: ['呋喃唑酮', '酒精', '酒'],
    risk: INTERACTION_RISK.HIGH,
    title: '双硫仑样反应',
    description: '呋喃唑酮（痢特灵）与酒精同服可引发严重双硫仑样反应。'
  },
  {
    drugs: ['格列本脲', '酒精', '酒'],
    risk: INTERACTION_RISK.HIGH,
    title: '严重低血糖',
    description: '格列本脲与酒精同服可导致严重低血糖，并可能加重神经系统抑制作用。'
  },
  {
    drugs: ['对乙酰氨基酚', '对乙酰氨基酚'],
    risk: INTERACTION_RISK.HIGH,
    title: '重复用药-肝损伤',
    description: '同时使用两种含对乙酰氨基酚的药物（如泰诺+复方感冒灵、白加黑+感康等），可导致对乙酰氨基酚过量，引发严重肝损伤甚至肝坏死。成人每日最大剂量不超过2g。'
  },
  {
    drugs: ['对乙酰氨基酚', '酒精', '酒'],
    risk: INTERACTION_RISK.HIGH,
    title: '急性肝损伤',
    description: '对乙酰氨基酚与酒精同服显著增加肝损伤风险，严重者可导致急性肝衰竭。服药前后禁止饮酒。'
  },
  {
    drugs: ['布洛芬', '阿司匹林'],
    risk: INTERACTION_RISK.HIGH,
    title: '消化道出血风险',
    description: '两种非甾体抗炎药同服会显著增加胃肠道溃疡、出血风险，同时增加肾脏损伤风险。应避免合用。'
  },
  {
    drugs: ['布洛芬', '萘普生'],
    risk: INTERACTION_RISK.HIGH,
    title: '消化道出血风险',
    description: '两种非甾体抗炎药同服会显著增加胃肠道溃疡、出血风险。应避免合用。'
  },
  {
    drugs: ['布洛芬', '双氯芬酸'],
    risk: INTERACTION_RISK.HIGH,
    title: '消化道出血风险',
    description: '两种非甾体抗炎药同服会显著增加胃肠道溃疡、出血风险。应避免合用。'
  },
  {
    drugs: ['阿司匹林', '华法林'],
    risk: INTERACTION_RISK.HIGH,
    title: '出血风险显著增加',
    description: '阿司匹林与华法林合用会显著增强抗凝作用，大幅增加出血风险。如需合用必须严格监测INR值。'
  },
  {
    drugs: ['阿司匹林', '氯吡格雷'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '出血风险增加',
    description: '双联抗血小板治疗会增加出血风险，但在特定心血管疾病中是必需的，需在医生指导下使用。'
  },
  {
    drugs: ['华法林', '布洛芬'],
    risk: INTERACTION_RISK.HIGH,
    title: '出血风险显著增加',
    description: '布洛芬可增强华法林的抗凝作用，同时损伤胃黏膜，显著增加出血风险。应避免合用。'
  },
  {
    drugs: ['华法林', '对乙酰氨基酚'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '抗凝作用增强',
    description: '长期大剂量使用对乙酰氨基酚可能增强华法林的抗凝作用，需监测INR值。'
  },
  {
    drugs: ['华法林', '左氧氟沙星'],
    risk: INTERACTION_RISK.HIGH,
    title: '出血风险显著增加',
    description: '左氧氟沙星可显著增强华法林的抗凝作用，增加出血风险。合用时需密切监测INR值。'
  },
  {
    drugs: ['华法林', '环丙沙星'],
    risk: INTERACTION_RISK.HIGH,
    title: '出血风险显著增加',
    description: '环丙沙星可增强华法林的抗凝作用，增加出血风险。合用时需密切监测INR值。'
  },
  {
    drugs: ['华法林', '甲硝唑'],
    risk: INTERACTION_RISK.HIGH,
    title: '出血风险显著增加',
    description: '甲硝唑可显著增强华法林的抗凝作用，增加出血风险。合用时需密切监测INR值。'
  },
  {
    drugs: ['华法林', '磺胺甲恶唑'],
    risk: INTERACTION_RISK.HIGH,
    title: '出血风险显著增加',
    description: '复方磺胺甲恶唑可显著增强华法林的抗凝作用，增加出血风险。'
  },
  {
    drugs: ['华法林', '奥美拉唑'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '抗凝作用变化',
    description: '奥美拉唑可能轻度影响华法林代谢，建议监测INR值。'
  },
  {
    drugs: ['硝苯地平', '西地那非'],
    risk: INTERACTION_RISK.HIGH,
    title: '严重低血压',
    description: '钙通道阻滞剂与西地那非合用可导致严重低血压，甚至休克。禁忌合用。'
  },
  {
    drugs: ['硝酸甘油', '西地那非'],
    risk: INTERACTION_RISK.HIGH,
    title: '严重低血压/休克',
    description: '硝酸酯类药物与西地那非合用可导致严重低血压甚至休克，危及生命。禁忌合用，使用西地那非前后24小时内禁止使用硝酸酯类。'
  },
  {
    drugs: ['单硝酸异山梨酯', '西地那非'],
    risk: INTERACTION_RISK.HIGH,
    title: '严重低血压/休克',
    description: '硝酸酯类药物与西地那非合用可导致严重低血压甚至休克。禁忌合用。'
  },
  {
    drugs: ['氨氯地平', '西地那非'],
    risk: INTERACTION_RISK.HIGH,
    title: '严重低血压',
    description: '降压药与西地那非合用可导致血压显著下降。禁忌合用。'
  },
  {
    drugs: ['缬沙坦', '西地那非'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '降压作用增强',
    description: 'ARB类降压药与西地那非合用可能增强降压效果，需注意监测血压。'
  },
  {
    drugs: ['辛伐他汀', '红霉素'],
    risk: INTERACTION_RISK.HIGH,
    title: '横纹肌溶解风险',
    description: '红霉素可抑制辛伐他汀代谢，显著增加肌病和横纹肌溶解风险。应避免合用。'
  },
  {
    drugs: ['辛伐他汀', '克拉霉素'],
    risk: INTERACTION_RISK.HIGH,
    title: '横纹肌溶解风险',
    description: '克拉霉素可抑制辛伐他汀代谢，显著增加肌病和横纹肌溶解风险。应避免合用。'
  },
  {
    drugs: ['辛伐他汀', '伊曲康唑'],
    risk: INTERACTION_RISK.HIGH,
    title: '横纹肌溶解风险',
    description: '伊曲康唑可显著抑制辛伐他汀代谢，增加肌病和横纹肌溶解风险。禁忌合用。'
  },
  {
    drugs: ['辛伐他汀', '葡萄柚', '西柚'],
    risk: INTERACTION_RISK.HIGH,
    title: '横纹肌溶解风险',
    description: '葡萄柚（西柚）及果汁可显著抑制辛伐他汀代谢，增加肌病和横纹肌溶解风险。服药期间禁止食用西柚。'
  },
  {
    drugs: ['阿托伐他汀', '克拉霉素'],
    risk: INTERACTION_RISK.HIGH,
    title: '横纹肌溶解风险',
    description: '克拉霉素可抑制阿托伐他汀代谢，增加肌病和横纹肌溶解风险。应避免合用。'
  },
  {
    drugs: ['阿托伐他汀', '伊曲康唑'],
    risk: INTERACTION_RISK.HIGH,
    title: '横纹肌溶解风险',
    description: '伊曲康唑可抑制阿托伐他汀代谢，增加肌病风险。应避免合用或减量。'
  },
  {
    drugs: ['阿托伐他汀', '葡萄柚', '西柚'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '肌病风险增加',
    description: '葡萄柚（西柚）可增加阿托伐他汀血药浓度，增加肌病风险。建议避免大量食用。'
  },
  {
    drugs: ['瑞舒伐他汀', '环孢素'],
    risk: INTERACTION_RISK.HIGH,
    title: '肌病/横纹肌溶解',
    description: '环孢素可显著增加瑞舒伐他汀血药浓度，增加肌病和横纹肌溶解风险。禁忌合用。'
  },
  {
    drugs: ['地高辛', '胺碘酮'],
    risk: INTERACTION_RISK.HIGH,
    title: '地高辛中毒',
    description: '胺碘酮可显著升高地高辛血药浓度，导致地高辛中毒（心律失常、恶心、视觉异常等）。合用时地高辛需减半。'
  },
  {
    drugs: ['地高辛', '维拉帕米'],
    risk: INTERACTION_RISK.HIGH,
    title: '地高辛中毒',
    description: '维拉帕米可升高地高辛血药浓度，增加中毒风险。合用时需监测地高辛浓度并减量。'
  },
  {
    drugs: ['地高辛', '红霉素'],
    risk: INTERACTION_RISK.HIGH,
    title: '地高辛中毒',
    description: '红霉素可抑制肠道菌群，增加地高辛吸收，导致血药浓度升高，增加中毒风险。'
  },
  {
    drugs: ['地高辛', '克拉霉素'],
    risk: INTERACTION_RISK.HIGH,
    title: '地高辛中毒',
    description: '克拉霉素可增加地高辛血药浓度，增加中毒风险。合用时需监测地高辛浓度。'
  },
  {
    drugs: ['地高辛', '螺内酯'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '地高辛浓度升高',
    description: '螺内酯可升高地高辛血药浓度，合用时需监测地高辛浓度。'
  },
  {
    drugs: ['卡马西平', '红霉素'],
    risk: INTERACTION_RISK.HIGH,
    title: '卡马西平中毒',
    description: '红霉素可抑制卡马西平代谢，导致卡马西平中毒（共济失调、眼球震颤、嗜睡等）。'
  },
  {
    drugs: ['卡马西平', '克拉霉素'],
    risk: INTERACTION_RISK.HIGH,
    title: '卡马西平中毒',
    description: '克拉霉素可显著升高卡马西平血药浓度，导致中毒症状。'
  },
  {
    drugs: ['苯巴比妥', '苯妥英钠', '卡马西平'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '血药浓度变化',
    description: '多种抗癫痫药合用会相互影响代谢，需密切监测血药浓度和疗效。'
  },
  {
    drugs: ['利福平', '华法林'],
    risk: INTERACTION_RISK.HIGH,
    title: '抗凝作用减弱',
    description: '利福平可显著加速华法林代谢，导致抗凝作用减弱，血栓风险增加。合用时需大幅增加华法林剂量并密切监测INR。'
  },
  {
    drugs: ['利福平', '辛伐他汀'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '降脂作用减弱',
    description: '利福平可加速辛伐他汀代谢，降低降脂效果。可能需要调整他汀剂量。'
  },
  {
    drugs: ['利福平', '地高辛'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '地高辛浓度降低',
    description: '利福平可加速地高辛代谢，降低其疗效。合用时需监测地高辛浓度。'
  },
  {
    drugs: ['奥美拉唑', '氯吡格雷'],
    risk: INTERACTION_RISK.HIGH,
    title: '氯吡格雷疗效降低',
    description: '奥美拉唑可抑制氯吡格雷活化，显著降低其抗血小板疗效，增加心血管事件风险。建议改用泮托拉唑或雷贝拉唑。'
  },
  {
    drugs: ['埃索美拉唑', '氯吡格雷'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '氯吡格雷疗效降低',
    description: '埃索美拉唑可能轻度降低氯吡格雷疗效，需谨慎合用。'
  },
  {
    drugs: ['盐酸麻黄碱', '苯乙肼'],
    risk: INTERACTION_RISK.HIGH,
    title: '高血压危象',
    description: '伪麻黄碱与单胺氧化酶抑制剂合用可导致严重高血压危象。禁忌合用。'
  },
  {
    drugs: ['二甲双胍', '造影剂'],
    risk: INTERACTION_RISK.HIGH,
    title: '乳酸酸中毒',
    description: '使用碘造影剂前后48小时需暂停二甲双胍，否则可能导致乳酸酸中毒。'
  },
  {
    drugs: ['二甲双胍', '酒精', '酒'],
    risk: INTERACTION_RISK.HIGH,
    title: '乳酸酸中毒',
    description: '酒精可增强二甲双胍对乳酸代谢的影响，增加乳酸酸中毒风险。服药期间禁止过量饮酒。'
  },
  {
    drugs: ['格列美脲', '阿司匹林'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '低血糖风险增加',
    description: '阿司匹林可增强磺酰脲类降糖药的作用，增加低血糖风险。合用时需监测血糖。'
  },
  {
    drugs: ['胰岛素', '普萘洛尔'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '低血糖症状被掩盖',
    description: 'β受体阻滞剂可掩盖低血糖引起的心动过速等症状，延误低血糖的识别。'
  },
  {
    drugs: ['左氧氟沙星', '钙片', '碳酸钙'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '抗生素吸收减少',
    description: '喹诺酮类抗生素可与钙、镁、铝等金属离子形成络合物，显著降低吸收。两药需间隔2小时以上服用。'
  },
  {
    drugs: ['左氧氟沙星', '牛奶'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '抗生素吸收减少',
    description: '牛奶中的钙可影响左氧氟沙星吸收，建议用清水送服，服药前后2小时避免饮用牛奶。'
  },
  {
    drugs: ['环丙沙星', '铝碳酸镁'],
    risk: INTERACTION_RISK.HIGH,
    title: '抗生素吸收显著减少',
    description: '含铝/镁抗酸药可使喹诺酮类吸收大幅降低，导致治疗失败。两药需间隔4小时以上服用。'
  },
  {
    drugs: ['四环素', '钙片', '碳酸钙'],
    risk: INTERACTION_RISK.HIGH,
    title: '抗生素吸收显著减少',
    description: '四环素类与钙形成不溶性络合物，几乎完全不被吸收。禁止同服。'
  },
  {
    drugs: ['四环素', '牛奶'],
    risk: INTERACTION_RISK.HIGH,
    title: '抗生素吸收显著减少',
    description: '牛奶中的钙可显著影响四环素类吸收，禁止同服。'
  },
  {
    drugs: ['铁剂', '钙片', '碳酸钙'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '铁吸收减少',
    description: '钙剂可影响铁剂吸收，两药需间隔2小时以上服用。'
  },
  {
    drugs: ['铁剂', '四环素'],
    risk: INTERACTION_RISK.HIGH,
    title: '两者吸收均减少',
    description: '铁剂与四环素类相互影响吸收，两者疗效均降低。禁止同服。'
  },
  {
    drugs: ['铁剂', '茶'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '铁吸收减少',
    description: '茶叶中的鞣酸可与铁结合形成不溶性化合物，影响铁吸收。服用铁剂前后1小时避免饮茶。'
  },
  {
    drugs: ['左甲状腺素', '钙片', '碳酸钙'],
    risk: INTERACTION_RISK.HIGH,
    title: '甲状腺素吸收减少',
    description: '钙剂可显著影响左甲状腺素吸收，导致甲状腺功能控制不佳。两药需间隔4小时以上服用。'
  },
  {
    drugs: ['左甲状腺素', '铁剂'],
    risk: INTERACTION_RISK.HIGH,
    title: '甲状腺素吸收减少',
    description: '铁剂可显著影响左甲状腺素吸收，需间隔4小时以上服用。'
  },
  {
    drugs: ['左甲状腺素', '铝碳酸镁'],
    risk: INTERACTION_RISK.HIGH,
    title: '甲状腺素吸收减少',
    description: '含铝/镁抗酸药可影响左甲状腺素吸收，需间隔4小时以上服用。'
  },
  {
    drugs: ['泼尼松', '阿司匹林'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '消化道出血风险增加',
    description: '糖皮质激素与阿司匹林合用增加消化道溃疡和出血风险，需加用胃黏膜保护剂。'
  },
  {
    drugs: ['泼尼松', '布洛芬'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '消化道出血风险增加',
    description: '糖皮质激素与非甾体抗炎药合用增加消化道溃疡风险。'
  },
  {
    drugs: ['螺内酯', '卡托普利'],
    risk: INTERACTION_RISK.HIGH,
    title: '高钾血症',
    description: '螺内酯（保钾利尿剂）与ACEI合用可导致严重高钾血症，危及生命。需密切监测血钾。'
  },
  {
    drugs: ['螺内酯', '缬沙坦'],
    risk: INTERACTION_RISK.HIGH,
    title: '高钾血症',
    description: '螺内酯与ARB合用可导致严重高钾血症。需密切监测血钾。'
  },
  {
    drugs: ['螺内酯', '氯化钾'],
    risk: INTERACTION_RISK.HIGH,
    title: '严重高钾血症',
    description: '螺内酯与补钾剂合用可导致严重高钾血症，危及生命。禁忌合用。'
  },
  {
    drugs: ['ACEI', '补达秀', '氯化钾'],
    risk: INTERACTION_RISK.HIGH,
    title: '严重高钾血症',
    description: 'ACEI类降压药（如卡托普利、依那普利）与补钾剂合用可导致严重高钾血症。'
  },
  {
    drugs: ['呋塞米', '氨基糖苷类'],
    risk: INTERACTION_RISK.HIGH,
    title: '耳毒性/肾毒性增强',
    description: '呋塞米与氨基糖苷类抗生素（庆大霉素、阿米卡星等）合用可显著增强耳毒性和肾毒性。应避免合用。'
  },
  {
    drugs: ['万古霉素', '呋塞米'],
    risk: INTERACTION_RISK.HIGH,
    title: '肾毒性/耳毒性增强',
    description: '万古霉素与呋塞米合用可显著增强肾毒性和耳毒性。应避免合用。'
  },
  {
    drugs: ['氨基糖苷类', '万古霉素'],
    risk: INTERACTION_RISK.HIGH,
    title: '肾毒性/耳毒性显著增强',
    description: '两类药物合用肾毒性和耳毒性显著增强。禁忌合用。'
  },
  {
    drugs: ['顺铂', '氨基糖苷类'],
    risk: INTERACTION_RISK.HIGH,
    title: '肾毒性/耳毒性显著增强',
    description: '顺铂与氨基糖苷类合用肾毒性和耳毒性显著增强。应避免合用。'
  },
  {
    drugs: ['伊曲康唑', '西沙必利'],
    risk: INTERACTION_RISK.HIGH,
    title: '严重心律失常',
    description: '伊曲康唑可升高西沙必利血药浓度，导致QT间期延长和严重心律失常。禁忌合用。'
  },
  {
    drugs: ['红霉素', '西沙必利'],
    risk: INTERACTION_RISK.HIGH,
    title: '严重心律失常',
    description: '红霉素可升高西沙必利血药浓度，导致QT间期延长。禁忌合用。'
  },
  {
    drugs: ['氯雷他定', '酮康唑'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '心律失常风险增加',
    description: '酮康唑可抑制氯雷他定代谢，增加QT间期延长风险。'
  },
  {
    drugs: ['苯海拉明', '酒精', '酒'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '中枢抑制增强',
    description: '抗组胺药与酒精同服可加重嗜睡、头晕等中枢抑制症状，应避免饮酒。'
  },
  {
    drugs: ['氯苯那敏', '酒精', '酒'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '中枢抑制增强',
    description: '扑尔敏与酒精同服可加重嗜睡、头晕等症状，应避免饮酒。'
  },
  {
    drugs: ['西替利嗪', '酒精', '酒'],
    risk: INTERACTION_RISK.LOW,
    title: '嗜睡加重',
    description: '西替利嗪与酒精同服可能加重嗜睡，建议避免饮酒。'
  },
  {
    drugs: ['阿普唑仑', '酒精', '酒'],
    risk: INTERACTION_RISK.HIGH,
    title: '严重中枢抑制/呼吸抑制',
    description: '苯二氮卓类镇静催眠药与酒精同服可导致严重中枢抑制、呼吸抑制甚至死亡。服药期间禁止饮酒。'
  },
  {
    drugs: ['艾司唑仑', '酒精', '酒'],
    risk: INTERACTION_RISK.HIGH,
    title: '严重中枢抑制/呼吸抑制',
    description: '安定类药物与酒精同服可导致严重呼吸抑制甚至死亡。服药期间禁止饮酒。'
  },
  {
    drugs: ['唑吡坦', '酒精', '酒'],
    risk: INTERACTION_RISK.HIGH,
    title: '严重中枢抑制',
    description: '催眠药与酒精同服可导致严重中枢抑制。服药期间禁止饮酒。'
  },
  {
    drugs: ['右美沙芬', '单胺氧化酶抑制剂'],
    risk: INTERACTION_RISK.HIGH,
    title: '5-羟色胺综合征',
    description: '右美沙芬与MAOI合用可导致严重5-羟色胺综合征（高热、肌阵挛、意识障碍），甚至死亡。禁忌合用。'
  },
  {
    drugs: ['氟西汀', '单胺氧化酶抑制剂'],
    risk: INTERACTION_RISK.HIGH,
    title: '5-羟色胺综合征',
    description: 'SSRI类抗抑郁药与MAOI合用可导致致死性5-羟色胺综合征。两药需间隔至少2周（氟西汀需5周）。'
  },
  {
    drugs: ['舍曲林', '单胺氧化酶抑制剂'],
    risk: INTERACTION_RISK.HIGH,
    title: '5-羟色胺综合征',
    description: '舍曲林与MAOI合用可导致严重5-羟色胺综合征。禁忌合用。'
  },
  {
    drugs: ['氟西汀', '曲马多'],
    risk: INTERACTION_RISK.HIGH,
    title: '5-羟色胺综合征',
    description: 'SSRI与曲马多合用增加5-羟色胺综合征风险。需谨慎合用，密切观察。'
  },
  {
    drugs: ['西酞普兰', '曲马多'],
    risk: INTERACTION_RISK.HIGH,
    title: '5-羟色胺综合征',
    description: 'SSRI与曲马多合用增加5-羟色胺综合征风险。'
  },
  {
    drugs: ['甲氧氯普胺', '阿托品'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '药效相互拮抗',
    description: '胃复安促进胃肠蠕动，阿托品抑制胃肠蠕动，两者作用相互拮抗。'
  },
  {
    drugs: ['多潘立酮', '酮康唑'],
    risk: INTERACTION_RISK.HIGH,
    title: '严重心律失常',
    description: '酮康唑可显著升高多潘立酮血药浓度，导致QT间期延长和严重心律失常。禁忌合用。'
  },
  {
    drugs: ['多潘立酮', '红霉素'],
    risk: INTERACTION_RISK.HIGH,
    title: '严重心律失常',
    description: '红霉素可升高多潘立酮血药浓度，增加QT间期延长风险。禁忌合用。'
  },
  {
    drugs: ['秋水仙碱', '红霉素'],
    risk: INTERACTION_RISK.HIGH,
    title: '秋水仙碱中毒',
    description: '红霉素可升高秋水仙碱血药浓度，导致严重毒性反应（肌痛、肌无力、骨髓抑制）。'
  },
  {
    drugs: ['秋水仙碱', '克拉霉素'],
    risk: INTERACTION_RISK.HIGH,
    title: '秋水仙碱中毒',
    description: '克拉霉素可显著升高秋水仙碱血药浓度，导致严重毒性。禁忌合用。'
  },
  {
    drugs: ['别嘌醇', '氨苄西林'],
    risk: INTERACTION_RISK.MEDIUM,
    title: '皮疹发生率增加',
    description: '别嘌醇与氨苄西林合用皮疹发生率显著增加。建议更换抗生素。'
  },
  {
    drugs: ['丙磺舒', '青霉素'],
    risk: INTERACTION_RISK.LOW,
    title: '青霉素血药浓度升高',
    description: '丙磺舒可抑制青霉素排泄，延长其作用时间。有时临床有意合用增强疗效。'
  },
  {
    drugs: ['丙磺舒', '头孢菌素'],
    risk: INTERACTION_RISK.LOW,
    title: '头孢血药浓度升高',
    description: '丙磺舒可抑制头孢菌素排泄，升高其血药浓度。'
  }
]

export function getMedicineKeywords(medicineName) {
  if (!medicineName) return []
  const name = medicineName.toLowerCase()
  const keywords = new Set()
  keywords.add(name)
  keywords.add(medicineName)

  if (/头孢/.test(medicineName)) keywords.add('头孢')
  if (/阿莫西林|青霉素|氨苄西林|哌拉西林|美洛西林/.test(medicineName)) keywords.add('青霉素')
  if (/对乙酰氨基酚|扑热息痛|泰诺|必理通|百服宁/.test(medicineName)) keywords.add('对乙酰氨基酚')
  if (/布洛芬|芬必得/.test(medicineName)) keywords.add('布洛芬')
  if (/阿司匹林|拜阿司匹灵/.test(medicineName)) keywords.add('阿司匹林')
  if (/萘普生|消痛灵/.test(medicineName)) keywords.add('萘普生')
  if (/双氯芬酸|扶他林|英太青/.test(medicineName)) keywords.add('双氯芬酸')
  if (/华法林/.test(medicineName)) keywords.add('华法林')
  if (/氯吡格雷|波立维|泰嘉/.test(medicineName)) keywords.add('氯吡格雷')
  if (/硝苯地平|心痛定|拜新同|伲福达/.test(medicineName)) keywords.add('硝苯地平')
  if (/氨氯地平|络活喜/.test(medicineName)) keywords.add('氨氯地平')
  if (/维拉帕米|异搏定/.test(medicineName)) keywords.add('维拉帕米')
  if (/硝酸甘油|硝酸异山梨酯|消心痛|单硝酸异山梨酯|异乐定|欣康/.test(medicineName)) keywords.add('硝酸甘油')
  if (/西地那非|万艾可|伟哥/.test(medicineName)) keywords.add('西地那非')
  if (/缬沙坦|代文|复代文/.test(medicineName)) keywords.add('缬沙坦')
  if (/卡托普利|开博通|依那普利|贝那普利|洛汀新|福辛普利|蒙诺|ACEI/.test(medicineName)) keywords.add('ACEI')
  if (/辛伐他汀|舒降之|京必舒新/.test(medicineName)) keywords.add('辛伐他汀')
  if (/阿托伐他汀|立普妥|阿乐/.test(medicineName)) keywords.add('阿托伐他汀')
  if (/瑞舒伐他汀|可定|京诺/.test(medicineName)) keywords.add('瑞舒伐他汀')
  if (/地高辛|狄戈辛/.test(medicineName)) keywords.add('地高辛')
  if (/胺碘酮|可达龙/.test(medicineName)) keywords.add('胺碘酮')
  if (/螺内酯|安体舒通/.test(medicineName)) keywords.add('螺内酯')
  if (/呋塞米|速尿/.test(medicineName)) keywords.add('呋塞米')
  if (/氯化钾|补达秀|果味钾/.test(medicineName)) keywords.add('氯化钾')
  if (/卡马西平|得理多/.test(medicineName)) keywords.add('卡马西平')
  if (/苯妥英钠|大仑丁/.test(medicineName)) keywords.add('苯妥英钠')
  if (/苯巴比妥|鲁米那/.test(medicineName)) keywords.add('苯巴比妥')
  if (/利福平/.test(medicineName)) keywords.add('利福平')
  if (/奥美拉唑|洛赛克|奥克/.test(medicineName)) keywords.add('奥美拉唑')
  if (/埃索美拉唑|耐信/.test(medicineName)) keywords.add('埃索美拉唑')
  if (/泮托拉唑|雷贝拉唑|波利特|达克普隆/.test(medicineName)) keywords.add('奥美拉唑')
  if (/红霉素/.test(medicineName)) keywords.add('红霉素')
  if (/克拉霉素|锋锐/.test(medicineName)) keywords.add('克拉霉素')
  if (/左氧氟沙星|可乐必妥|来立信/.test(medicineName)) keywords.add('左氧氟沙星')
  if (/环丙沙星|西普乐/.test(medicineName)) keywords.add('环丙沙星')
  if (/甲硝唑|灭滴灵/.test(medicineName)) keywords.add('甲硝唑')
  if (/替硝唑/.test(medicineName)) keywords.add('替硝唑')
  if (/伊曲康唑|斯皮仁诺/.test(medicineName)) keywords.add('伊曲康唑')
  if (/酮康唑|里素劳/.test(medicineName)) keywords.add('酮康唑')
  if (/万古霉素|稳可信/.test(medicineName)) keywords.add('万古霉素')
  if (/庆大霉素|阿米卡星|丁胺卡那|妥布霉素|奈替米星|依替米星|异帕米星|氨基糖苷/.test(medicineName)) keywords.add('氨基糖苷类')
  if (/磺胺甲恶唑|复方磺胺|SMZ|百炎净/.test(medicineName)) keywords.add('磺胺甲恶唑')
  if (/呋喃唑酮|痢特灵/.test(medicineName)) keywords.add('呋喃唑酮')
  if (/四环素|土霉素|多西环素|强力霉素|米诺环素|美满霉素/.test(medicineName)) keywords.add('四环素')
  if (/钙片|碳酸钙|葡萄糖酸钙|钙尔奇|迪巧/.test(medicineName)) keywords.add('钙片')
  if (/铝碳酸镁|达喜|氢氧化铝|胃舒平/.test(medicineName)) keywords.add('铝碳酸镁')
  if (/铁剂|硫酸亚铁|富马酸亚铁|琥珀酸亚铁|速力菲/.test(medicineName)) keywords.add('铁剂')
  if (/泼尼松|强的松|地塞米松|甲泼尼龙|美卓乐/.test(medicineName)) keywords.add('泼尼松')
  if (/左甲状腺素|优甲乐|雷替斯/.test(medicineName)) keywords.add('左甲状腺素')
  if (/二甲双胍|格华止|美迪康/.test(medicineName)) keywords.add('二甲双胍')
  if (/格列本脲|优降糖|格列美脲|亚莫利|格列齐特|达美康|格列吡嗪|瑞易宁|格列喹酮|糖适平/.test(medicineName)) keywords.add('格列本脲')
  if (/胰岛素/.test(medicineName)) keywords.add('胰岛素')
  if (/普萘洛尔|心得安|美托洛尔|倍他乐克|比索洛尔|康忻|阿替洛尔|氨酰心安/.test(medicineName)) keywords.add('普萘洛尔')
  if (/西沙必利|普瑞博思/.test(medicineName)) keywords.add('西沙必利')
  if (/多潘立酮|吗丁啉/.test(medicineName)) keywords.add('多潘立酮')
  if (/甲氧氯普胺|胃复安|灭吐灵/.test(medicineName)) keywords.add('甲氧氯普胺')
  if (/阿托品|654-2|山莨菪碱/.test(medicineName)) keywords.add('阿托品')
  if (/氯雷他定|开瑞坦/.test(medicineName)) keywords.add('氯雷他定')
  if (/西替利嗪|仙特明/.test(medicineName)) keywords.add('西替利嗪')
  if (/氯苯那敏|扑尔敏|苯海拉明|异丙嗪|非那根/.test(medicineName)) keywords.add('苯海拉明')
  if (/右美沙芬|咳必清/.test(medicineName)) keywords.add('右美沙芬')
  if (/麻黄碱|伪麻黄碱|麻黄素/.test(medicineName)) keywords.add('盐酸麻黄碱')
  if (/氟西汀|百忧解|舍曲林|左洛复|帕罗西汀|赛乐特|西酞普兰|喜普妙|艾司西酞普兰|来士普|SSRI/.test(medicineName)) keywords.add('氟西汀')
  if (/苯乙肼|司来吉兰|吗氯贝胺|单胺氧化酶|MAOI/.test(medicineName)) keywords.add('单胺氧化酶抑制剂')
  if (/阿普唑仑|佳静安定|艾司唑仑|舒乐安定|地西泮|安定|三唑仑|氯硝西泮|氯硝安定/.test(medicineName)) keywords.add('阿普唑仑')
  if (/唑吡坦|思诺思|佐匹克隆|右佐匹克隆/.test(medicineName)) keywords.add('唑吡坦')
  if (/曲马多|奇曼丁|舒敏/.test(medicineName)) keywords.add('曲马多')
  if (/造影剂|碘造影|泛影葡胺|碘海醇|碘普罗胺|优维显/.test(medicineName)) keywords.add('造影剂')
  if (/环孢素|新山地明|田可/.test(medicineName)) keywords.add('环孢素')
  if (/秋水仙碱|秋水仙素/.test(medicineName)) keywords.add('秋水仙碱')
  if (/别嘌醇|别嘌呤醇/.test(medicineName)) keywords.add('别嘌醇')
  if (/氨苄西林|氨苄青霉素/.test(medicineName)) keywords.add('氨苄西林')
  if (/丙磺舒|羧苯磺胺/.test(medicineName)) keywords.add('丙磺舒')
  if (/顺铂|铂类|卡铂|奥沙利铂/.test(medicineName)) keywords.add('顺铂')
  if (/牛奶/.test(medicineName)) keywords.add('牛奶')
  if (/茶|茶水/.test(medicineName)) keywords.add('茶')
  if (/葡萄柚|西柚/.test(medicineName)) keywords.add('葡萄柚')

  return Array.from(keywords)
}

export function findInteractions(medicineNameA, medicineNameB) {
  const keywordsA = getMedicineKeywords(medicineNameA)
  const keywordsB = getMedicineKeywords(medicineNameB)

  const interactions = []

  for (const rule of DRUG_INTERACTIONS) {
    const hasA = rule.drugs.some((d) => keywordsA.includes(d) || keywordsA.some((k) => k.includes(d)) || medicineNameA.includes(d))
    const hasB = rule.drugs.some((d) => keywordsB.includes(d) || keywordsB.some((k) => k.includes(d)) || medicineNameB.includes(d))

    if (hasA && hasB) {
      interactions.push(rule)
    }
  }

  const unique = []
  const seen = new Set()
  for (const it of interactions) {
    const key = it.title
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(it)
    }
  }

  return unique
}

export function findInteractionsForList(medicineNames) {
  const allInteractions = []

  for (let i = 0; i < medicineNames.length; i++) {
    for (let j = i + 1; j < medicineNames.length; j++) {
      const interactions = findInteractions(medicineNames[i], medicineNames[j])
      for (const it of interactions) {
        allInteractions.push({
          ...it,
          drugA: medicineNames[i],
          drugB: medicineNames[j]
        })
      }
    }
  }

  return allInteractions
}
