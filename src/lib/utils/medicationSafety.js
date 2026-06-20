import { INTERACTION_RISK } from './constants.js'
import { findInteractions, findInteractionsForList, getMedicineKeywords } from './drugInteractions.js'

export const ALLERGY_DRUG_MAP = {
  penicillin: ['青霉素', '阿莫西林', '氨苄西林', '哌拉西林', '美洛西林', '苄星青霉素', '青霉素V', '阿莫西林克拉维酸', '哌拉西林他唑巴坦'],
  cephalosporin: ['头孢', '头孢拉定', '头孢氨苄', '头孢呋辛', '头孢克肟', '头孢噻肟', '头孢曲松', '头孢他啶', '头孢吡肟', '头孢克洛', '头孢地尼', '头孢孟多', '头孢哌酮'],
  sulfonamide: ['磺胺', '磺胺甲恶唑', '复方磺胺', 'SMZ', '百炎净', '磺胺嘧啶', '柳氮磺吡啶', '磺胺醋酰'],
  aspirin: ['阿司匹林', '拜阿司匹灵', '乙酰水杨酸', 'APC', '解热止痛片', '阿咖酚'],
  nsaid: ['布洛芬', '芬必得', '萘普生', '消痛灵', '双氯芬酸', '扶他林', '英太青', '美洛昔康', '塞来昔布', '依托考昔', '洛索洛芬', '对乙酰氨基酚', '扑热息痛'],
  iodine: ['碘酒', '碘伏', '碘酊', '碘剂', '卢戈液', '碘造影', '泛影葡胺', '碘海醇', '碘普罗胺'],
  codeine: ['可待因', '吗啡', '哌替啶', '杜冷丁', '芬太尼', '舒芬太尼', '羟考酮', '曲马多'],
  antibiotic_other: ['四环素', '土霉素', '红霉素', '阿奇霉素', '克拉霉素', '庆大霉素', '阿米卡星', '左氧氟沙星', '环丙沙星', '莫西沙星', '万古霉素']
}

export const DISEASE_DRUG_WARNING = {
  hypertension: [
    { drugs: ['伪麻黄碱', '麻黄碱', '盐酸麻黄碱', '去氧肾上腺素'], level: INTERACTION_RISK.HIGH, title: '可能升高血压', description: '含伪麻黄碱的感冒药/滴鼻剂可升高血压，高血压患者慎用。' },
    { drugs: ['泼尼松', '地塞米松', '甲泼尼龙', '氢化可的松'], level: INTERACTION_RISK.MEDIUM, title: '可能升高血压', description: '长期使用糖皮质激素可引起水钠潴留，升高血压，需监测血压。' },
    { drugs: ['布洛芬', '萘普生', '双氯芬酸', '吲哚美辛'], level: INTERACTION_RISK.MEDIUM, title: '可能影响降压效果', description: '非甾体抗炎药可能影响降压药疗效，需监测血压。' }
  ],
  diabetes: [
    { drugs: ['泼尼松', '地塞米松', '甲泼尼龙', '氢化可的松'], level: INTERACTION_RISK.HIGH, title: '升高血糖', description: '糖皮质激素可显著升高血糖，糖尿病患者需密切监测血糖，可能需要调整降糖药剂量。' },
    { drugs: ['氢氯噻嗪', '呋塞米', '吲达帕胺'], level: INTERACTION_RISK.MEDIUM, title: '升高血糖', description: '部分利尿剂可能影响糖代谢，需监测血糖。' }
  ],
  heart_disease: [
    { drugs: ['伪麻黄碱', '麻黄碱', '盐酸麻黄碱'], level: INTERACTION_RISK.HIGH, title: '可能诱发心绞痛', description: '含伪麻黄碱的药物可增加心率和心脏负担，心脏病患者慎用或禁用。' },
    { drugs: ['红霉素', '克拉霉素', '阿奇霉素', '左氧氟沙星', '环丙沙星', '莫西沙星'], level: INTERACTION_RISK.MEDIUM, title: '可能延长QT间期', description: '部分抗生素可能延长QT间期，有心脏病史者慎用，需评估风险。' }
  ],
  liver_disease: [
    { drugs: ['对乙酰氨基酚', '扑热息痛', '泰诺', '百服宁'], level: INTERACTION_RISK.HIGH, title: '肝损伤风险', description: '对乙酰氨基酚主要经肝脏代谢，肝功能不全者慎用或禁用，可能导致肝衰竭。' },
    { drugs: ['辛伐他汀', '阿托伐他汀', '瑞舒伐他汀', '洛伐他汀', '普伐他汀', '氟伐他汀'], level: INTERACTION_RISK.MEDIUM, title: '肝功能影响', description: '他汀类可能引起转氨酶升高，肝功能异常者需密切监测或禁用。' },
    { drugs: ['甲氨蝶呤', '异烟肼', '利福平'], level: INTERACTION_RISK.HIGH, title: '肝毒性增强', description: '肝功能不全者使用肝毒性药物风险显著增加，禁用或严密监测。' },
    { drugs: ['红霉素', '克拉霉素', '酮康唑', '伊曲康唑'], level: INTERACTION_RISK.MEDIUM, title: '肝损伤风险', description: '大环内酯类和唑类抗真菌药有一定肝毒性，肝功能不全者慎用。' }
  ],
  kidney_disease: [
    { drugs: ['布洛芬', '萘普生', '双氯芬酸', '吲哚美辛', '美洛昔康', '塞来昔布'], level: INTERACTION_RISK.HIGH, title: '肾损伤风险', description: '非甾体抗炎药可抑制肾血流，肾功能不全者禁用或慎用，可能加重肾损伤。' },
    { drugs: ['氨基糖苷类', '庆大霉素', '阿米卡星', '妥布霉素', '奈替米星', '依替米星'], level: INTERACTION_RISK.HIGH, title: '肾毒性', description: '氨基糖苷类抗生素有明确肾毒性，肾功能不全者禁用。' },
    { drugs: ['万古霉素', '去甲万古霉素'], level: INTERACTION_RISK.HIGH, title: '肾毒性', description: '万古霉素有肾毒性，肾功能不全者需调整剂量并监测血药浓度。' },
    { drugs: ['造影剂', '碘海醇', '碘普罗胺', '泛影葡胺'], level: INTERACTION_RISK.HIGH, title: '造影剂肾病', description: '肾功能不全者使用碘造影剂可能导致造影剂肾病，需充分水化或避免使用。' },
    { drugs: ['螺内酯', '氨苯蝶啶', '阿米洛利'], level: INTERACTION_RISK.MEDIUM, title: '高钾血症风险', description: '保钾利尿剂在肾功能不全时可能导致严重高钾血症。' },
    { drugs: ['二甲双胍', '格华止', '美迪康'], level: INTERACTION_RISK.MEDIUM, title: '乳酸酸中毒风险', description: '肾功能不全者二甲双胍排泄受阻，可能导致乳酸酸中毒，eGFR<30禁用。' }
  ],
  asthma: [
    { drugs: ['阿司匹林', '布洛芬', '萘普生', '双氯芬酸'], level: INTERACTION_RISK.HIGH, title: '诱发哮喘发作', description: '阿司匹林和非甾体抗炎药可能诱发阿司匹林哮喘，哮喘患者禁用或慎用。' },
    { drugs: ['普萘洛尔', '美托洛尔', '阿替洛尔', '比索洛尔'], level: INTERACTION_RISK.MEDIUM, title: '可能诱发支气管痉挛', description: 'β受体阻滞剂可能诱发哮喘发作，哮喘患者需选用选择性β1受体阻滞剂并密切观察。' }
  ],
  gastritis: [
    { drugs: ['阿司匹林', '布洛芬', '萘普生', '双氯芬酸', '吲哚美辛'], level: INTERACTION_RISK.HIGH, title: '消化道出血/溃疡', description: '非甾体抗炎药可损伤胃黏膜，胃溃疡/胃炎患者禁用或加用胃黏膜保护剂。' },
    { drugs: ['泼尼松', '地塞米松', '甲泼尼龙'], level: INTERACTION_RISK.MEDIUM, title: '诱发溃疡', description: '糖皮质激素可能诱发或加重消化道溃疡，需加用胃黏膜保护剂。' },
    { drugs: ['氯化钾'], level: INTERACTION_RISK.MEDIUM, title: '胃肠道刺激', description: '氯化钾对胃肠道有刺激性，胃溃疡患者慎用，可选用缓释片并餐后服用。' }
  ],
  glaucoma: [
    { drugs: ['阿托品', '山莨菪碱', '654-2', '东莨菪碱', '苯海拉明', '氯苯那敏'], level: INTERACTION_RISK.HIGH, title: '可能升高眼压', description: '抗胆碱药和部分抗组胺药可能升高眼压，青光眼患者禁用。' },
    { drugs: ['伪麻黄碱', '麻黄碱'], level: INTERACTION_RISK.MEDIUM, title: '可能升高眼压', description: '拟交感神经药可能升高眼压，青光眼患者慎用。' },
    { drugs: ['泼尼松', '地塞米松', '甲泼尼龙'], level: INTERACTION_RISK.MEDIUM, title: '可能升高眼压', description: '长期使用糖皮质激素可能升高眼压、诱发白内障，青光眼患者需慎用。' }
  ],
  gout: [
    { drugs: ['氢氯噻嗪', '吲达帕胺', '呋塞米'], level: INTERACTION_RISK.HIGH, title: '升高尿酸', description: '利尿剂可升高血尿酸，诱发痛风发作，痛风患者避免使用。' },
    { drugs: ['阿司匹林', '小剂量阿司匹林'], level: INTERACTION_RISK.MEDIUM, title: '升高尿酸', description: '小剂量阿司匹林可能轻度升高血尿酸，但心血管获益大于风险，痛风患者可使用并监测。' },
    { drugs: ['烟酸'], level: INTERACTION_RISK.MEDIUM, title: '升高尿酸', description: '烟酸可能升高血尿酸，痛风患者慎用。' }
  ],
  epilepsy: [
    { drugs: ['左氧氟沙星', '环丙沙星', '莫西沙星', '诺氟沙星'], level: INTERACTION_RISK.HIGH, title: '可能诱发癫痫发作', description: '喹诺酮类抗生素可能诱发癫痫发作，有癫痫病史者禁用或慎用。' },
    { drugs: ['甲硝唑'], level: INTERACTION_RISK.MEDIUM, title: '可能诱发抽搐', description: '大剂量甲硝唑可能诱发抽搐，癫痫患者慎用。' },
    { drugs: ['氯丙嗪', '奋乃静', '氟哌啶醇'], level: INTERACTION_RISK.MEDIUM, title: '可能降低癫痫阈值', description: '部分抗精神病药可能降低癫痫发作阈值，需调整抗癫痫药剂量。' }
  ],
  depression: [
    { drugs: ['右美沙芬'], level: INTERACTION_RISK.HIGH, title: '5-羟色胺综合征', description: 'SSRI/SNRI类抗抑郁药与右美沙芬合用可能导致5-羟色胺综合征。' },
    { drugs: ['曲马多'], level: INTERACTION_RISK.HIGH, title: '5-羟色胺综合征', description: 'SSRI/SNRI类抗抑郁药与曲马多合用增加5-羟色胺综合征风险。' },
    { drugs: ['单胺氧化酶抑制剂', '苯乙肼', '司来吉兰'], level: INTERACTION_RISK.HIGH, title: '5-羟色胺综合征/高血压危象', description: 'MAOI与SSRI/SNRI合用禁忌，需充分清洗期。' }
  ],
  arrhythmia: [
    { drugs: ['红霉素', '克拉霉素', '阿奇霉素'], level: INTERACTION_RISK.HIGH, title: 'QT间期延长', description: '大环内酯类抗生素可能延长QT间期，诱发尖端扭转型室速，心律失常患者禁用或慎用。' },
    { drugs: ['左氧氟沙星', '环丙沙星', '莫西沙星'], level: INTERACTION_RISK.HIGH, title: 'QT间期延长', description: '喹诺酮类抗生素可能延长QT间期，心律失常患者慎用。' },
    { drugs: ['西沙必利', '多潘立酮', '吗丁啉'], level: INTERACTION_RISK.HIGH, title: 'QT间期延长', description: '促胃肠动力药可能延长QT间期，心律失常患者禁用或慎用。' },
    { drugs: ['氯丙嗪', '奋乃静', '氟哌啶醇', '利培酮'], level: INTERACTION_RISK.MEDIUM, title: 'QT间期延长', description: '部分抗精神病药可能延长QT间期，心律失常患者慎用。' }
  ]
}

export const ORGAN_DRUG_WARNING = {
  liver_mild: DISEASE_DRUG_WARNING.liver_disease,
  liver_severe: [
    ...DISEASE_DRUG_WARNING.liver_disease,
    { drugs: ['头孢哌酮', '头孢曲松', '红霉素', '利福平'], level: INTERACTION_RISK.HIGH, title: '严重肝损伤风险', description: '重度肝功能不全者禁用主要经肝脏代谢的药物。' }
  ],
  kidney_mild: DISEASE_DRUG_WARNING.kidney_disease,
  kidney_severe: [
    ...DISEASE_DRUG_WARNING.kidney_disease,
    { drugs: ['顺铂', '卡铂', '甲氨蝶呤'], level: INTERACTION_RISK.HIGH, title: '严重肾毒性', description: '重度肾功能不全者禁用肾毒性化疗药。' }
  ]
}

export function calculateAge(birthDate) {
  if (!birthDate) return null
  try {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  } catch {
    return null
  }
}

export function isChild(age) {
  return age != null && age < 18
}

export function isElderly(age) {
  return age != null && age >= 65
}

export function checkAllergyConflict(member, medicineName) {
  if (!member || !medicineName) return []
  const allergies = member.allergies || []
  const customAllergies = member.customAllergies || []
  const allAllergyKeywords = [...customAllergies]

  for (const allergy of allergies) {
    const relatedDrugs = ALLERGY_DRUG_MAP[allergy] || []
    allAllergyKeywords.push(allergy, ...relatedDrugs)
  }

  const medKeywords = getMedicineKeywords(medicineName)
  const conflicts = []

  for (const allergyKey of allAllergyKeywords) {
    if (!allergyKey) continue
    const match = medKeywords.some((k) => k.includes(allergyKey) || allergyKey.includes(k)) || medicineName.includes(allergyKey)
    if (match) {
      conflicts.push({
        type: 'allergy',
        level: INTERACTION_RISK.HIGH,
        allergy: allergyKey,
        medicine: medicineName,
        title: `过敏风险：${allergyKey}`,
        description: `${member.name || '该成员'}对${allergyKey}过敏，使用${medicineName}可能引发过敏反应，严重者可危及生命。`,
        blockSave: true
      })
    }
  }

  return conflicts
}

export function checkChronicDiseaseWarning(member, medicineName) {
  if (!member || !medicineName) return []
  const diseases = member.chronicDiseases || []
  const warnings = []
  const medKeywords = getMedicineKeywords(medicineName)

  for (const disease of diseases) {
    const rules = DISEASE_DRUG_WARNING[disease] || []
    for (const rule of rules) {
      const match = rule.drugs.some((d) =>
        medKeywords.some((k) => k.includes(d) || d.includes(k)) || medicineName.includes(d)
      )
      if (match) {
        warnings.push({
          type: 'disease',
          level: rule.level,
          disease,
          medicine: medicineName,
          title: rule.title,
          description: `${member.name || '该成员'}有${getDiseaseLabel(disease)}病史，${rule.description}`,
          blockSave: rule.level === INTERACTION_RISK.HIGH
        })
      }
    }
  }

  return warnings
}

export function checkOrganFunctionWarning(member, medicineName) {
  if (!member || !medicineName) return []
  const warnings = []
  const medKeywords = getMedicineKeywords(medicineName)

  const liverFunction = member.liverFunction
  const kidneyFunction = member.kidneyFunction

  if (liverFunction && liverFunction !== 'normal') {
    const rules = liverFunction === 'severe' ? ORGAN_DRUG_WARNING.liver_severe : ORGAN_DRUG_WARNING.liver_mild
    for (const rule of rules) {
      const match = rule.drugs.some((d) =>
        medKeywords.some((k) => k.includes(d) || d.includes(k)) || medicineName.includes(d)
      )
      if (match) {
        warnings.push({
          type: 'organ',
          level: rule.level,
          organ: 'liver',
          organLabel: liverFunction === 'severe' ? '重度肝功能异常' : '轻度肝功能异常',
          medicine: medicineName,
          title: rule.title,
          description: `${member.name || '该成员'}存在${liverFunction === 'severe' ? '重度' : '轻度'}肝功能异常，${rule.description}`,
          blockSave: rule.level === INTERACTION_RISK.HIGH
        })
      }
    }
  }

  if (kidneyFunction && kidneyFunction !== 'normal') {
    const rules = kidneyFunction === 'severe' ? ORGAN_DRUG_WARNING.kidney_severe : ORGAN_DRUG_WARNING.kidney_mild
    for (const rule of rules) {
      const match = rule.drugs.some((d) =>
        medKeywords.some((k) => k.includes(d) || d.includes(k)) || medicineName.includes(d)
      )
      if (match) {
        warnings.push({
          type: 'organ',
          level: rule.level,
          organ: 'kidney',
          organLabel: kidneyFunction === 'severe' ? '重度肾功能异常' : '轻度肾功能异常',
          medicine: medicineName,
          title: rule.title,
          description: `${member.name || '该成员'}存在${kidneyFunction === 'severe' ? '重度' : '轻度'}肾功能异常，${rule.description}`,
          blockSave: rule.level === INTERACTION_RISK.HIGH
        })
      }
    }
  }

  return warnings
}

export function checkDosageWarning(member, medicineName, dosage) {
  if (!member || !medicineName) return []
  const warnings = []
  const age = calculateAge(member.birthDate)
  const weight = member.weight

  if (isChild(age)) {
    warnings.push({
      type: 'dosage',
      level: INTERACTION_RISK.MEDIUM,
      title: '儿童用药剂量提示',
      description: `${member.name || '该成员'}为${age}岁儿童${weight ? `（体重${weight}kg）` : ''}，请按儿童剂量或体重换算剂量给药，避免用药过量。建议咨询医生或药师。`,
      blockSave: false
    })
  }

  if (isElderly(age)) {
    warnings.push({
      type: 'dosage',
      level: INTERACTION_RISK.MEDIUM,
      title: '老年人用药剂量提示',
      description: `${member.name || '该成员'}为${age}岁老年人，肝肾功能可能减退，建议从小剂量开始，密切观察药物反应。必要时咨询医生调整剂量。`,
      blockSave: false
    })
  }

  return warnings
}

export function checkDrugInteractionWithCurrent(member, newMedicineName, currentMedicines) {
  if (!member || !newMedicineName || !currentMedicines || currentMedicines.length === 0) {
    return []
  }

  const interactions = []
  const medName = newMedicineName

  for (const existingMed of currentMedicines) {
    if (!existingMed || existingMed === medName) continue
    const found = findInteractions(medName, existingMed)
    for (const it of found) {
      interactions.push({
        type: 'interaction',
        level: it.risk,
        drugA: medName,
        drugB: existingMed,
        title: it.title,
        description: it.description,
        blockSave: it.risk === INTERACTION_RISK.HIGH
      })
    }
  }

  const unique = []
  const seen = new Set()
  for (const it of interactions) {
    const key = `${it.drugA}-${it.drugB}-${it.title}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(it)
    }
  }

  return unique
}

export function checkAllWarnings(member, medicineName, currentMedicines, dosage) {
  const all = []

  all.push(...checkAllergyConflict(member, medicineName))
  all.push(...checkChronicDiseaseWarning(member, medicineName))
  all.push(...checkOrganFunctionWarning(member, medicineName))
  all.push(...checkDosageWarning(member, medicineName, dosage))
  all.push(...checkDrugInteractionWithCurrent(member, medicineName, currentMedicines))

  const hasBlocker = all.some((w) => w.blockSave)

  return {
    warnings: all,
    hasBlocker,
    hasHighRisk: all.some((w) => w.level === INTERACTION_RISK.HIGH),
    hasMediumRisk: all.some((w) => w.level === INTERACTION_RISK.MEDIUM),
    hasLowRisk: all.some((w) => w.level === INTERACTION_RISK.LOW)
  }
}

function getDiseaseLabel(value) {
  const map = {
    hypertension: '高血压',
    diabetes: '糖尿病',
    heart_disease: '心脏病',
    liver_disease: '肝脏疾病',
    kidney_disease: '肾脏疾病',
    asthma: '哮喘/慢阻肺',
    gastritis: '胃溃疡/胃炎',
    glaucoma: '青光眼',
    gout: '痛风/高尿酸',
    epilepsy: '癫痫',
    depression: '抑郁症/精神类疾病',
    arrhythmia: '心律失常'
  }
  return map[value] || value
}
