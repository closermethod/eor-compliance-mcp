/**
 * EOR Compliance MCP Server v1.0
 * By Elisabeth Hitz — 3+ years selling EOR solutions at Deel ($12B), Multiplier across EMEA
 *
 * 8 tools for AI agents handling Employer-of-Record and global hiring conversations.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// =====================================================
// COUNTRY EOR BRIEFS
// =====================================================

type CountryBrief = {
  market: string;
  flag: string;
  legal_framework: string;
  typical_eor_markup: string;
  entity_setup_cost_usd: string;
  entity_setup_time: string;
  typical_eor_breakeven_employees: string;
  payroll_complexity: "Low" | "Medium" | "High" | "Very High";
  must_haves: string[];
  common_pitfalls: string[];
  tax_burden_employer: string;
  notable_employee_protections: string[];
};

const COUNTRY_BRIEFS: Record<string, CountryBrief> = {
  uk: {
    market: "United Kingdom",
    flag: "🇬🇧",
    legal_framework: "Employment Rights Act 1996, Equality Act 2010. Post-Brexit, distinct from EU framework. IR35 rules govern contractor classification.",
    typical_eor_markup: "10-15% on top of gross payroll",
    entity_setup_cost_usd: "$8K-25K (UK Ltd company + setup + accountant retainer)",
    entity_setup_time: "2-6 weeks",
    typical_eor_breakeven_employees: "5-8 employees",
    payroll_complexity: "Medium",
    must_haves: [
      "PAYE registration with HMRC",
      "Workplace pension auto-enrolment (3% min employer contribution)",
      "Statutory sick pay, maternity/paternity coverage",
      "Right to work check (Brexit-strict)",
      "Employment contract within 2 months"
    ],
    common_pitfalls: [
      "IR35 misclassification — contractor/employee distinction is heavily enforced",
      "Forgetting workplace pension can trigger HMRC penalties up to £10K",
      "P45/P60 documentation must be issued correctly",
      "Sponsor licence required to hire non-UK nationals (took on extra weight post-Brexit)"
    ],
    tax_burden_employer: "13.8% Employer NI above £9,100 + 3% pension auto-enrol minimum",
    notable_employee_protections: [
      "Unfair dismissal rights kick in after 2 yrs continuous employment",
      "Statutory redundancy pay scales with tenure",
      "Holiday: 28 days minimum (incl. bank holidays)"
    ]
  },
  ireland: {
    market: "Ireland",
    flag: "🇮🇪",
    legal_framework: "Employment Equality Acts, Organisation of Working Time Act, multiple specific acts (e.g., Payment of Wages, Terms of Employment).",
    typical_eor_markup: "10-15%",
    entity_setup_cost_usd: "$6K-15K + ~€500/mo accountancy",
    entity_setup_time: "2-4 weeks",
    typical_eor_breakeven_employees: "4-6 employees",
    payroll_complexity: "Medium",
    must_haves: [
      "PAYE/PRSI registration with Revenue",
      "Pension scheme — mandatory auto-enrolment rolling out from 2026",
      "Written contract within 5 days of start (key terms)",
      "PRSI contributions"
    ],
    common_pitfalls: [
      "Auto-enrolment pension just launched — many employers underprepared",
      "EU GDPR + DPC scrutiny on HR data",
      "Bogus self-employment cases pursued by Revenue and WRC"
    ],
    tax_burden_employer: "11.05% Employer PRSI + pension contribution (auto-enrol scaling to 6% by 2034)",
    notable_employee_protections: [
      "Unfair Dismissal protection after 12 months",
      "Statutory sick pay introduced 2023",
      "20 days minimum holiday"
    ]
  },
  spain: {
    market: "Spain",
    flag: "🇪🇸",
    legal_framework: "Estatuto de los Trabajadores (Workers' Statute), Real Decreto Legislativo 2/2015. Strong worker protections.",
    typical_eor_markup: "12-18%",
    entity_setup_cost_usd: "$10K-30K + ongoing local accountant + local director",
    entity_setup_time: "6-12 weeks (NIE registrations, social security, tax)",
    typical_eor_breakeven_employees: "8-12 employees",
    payroll_complexity: "Very High",
    must_haves: [
      "Social Security registration (Seguridad Social)",
      "Industry-specific convenio colectivo compliance (collective agreement)",
      "Mandatory paga extra (extra payments June + December)",
      "Severance reserves (deduce risk)",
      "Time tracking law compliance (Real Decreto-ley 8/2019)"
    ],
    common_pitfalls: [
      "Convenios vary by industry AND region — wrong one applied = backpay liability",
      "Falsos autónomos (false self-employed) cases — Inspección de Trabajo aggressive",
      "Termination is expensive: 33-45 days/year worked",
      "Igualdad (equality) plans required for cos with 50+ employees"
    ],
    tax_burden_employer: "29-31% (employer social security incl. unemployment, training, pensions)",
    notable_employee_protections: [
      "Unfair dismissal compensation: 33 days/year (max 24 months)",
      "Strict night work and overtime rules",
      "30 calendar days minimum holiday + 14 public holidays"
    ]
  },
  germany: {
    market: "Germany",
    flag: "🇩🇪",
    legal_framework: "BGB (Civil Code), Kündigungsschutzgesetz (Termination Protection Act), Betriebsverfassungsgesetz (Works Council Act), Arbeitnehmerüberlassungsgesetz (AÜG) for staffing.",
    typical_eor_markup: "12-18%",
    entity_setup_cost_usd: "$15K-50K (GmbH €25K min capital + notary + tax adviser)",
    entity_setup_time: "8-16 weeks",
    typical_eor_breakeven_employees: "10-15 employees",
    payroll_complexity: "Very High",
    must_haves: [
      "Steuernummer (tax number) and Sozialversicherung registration",
      "Health insurance (statutory or private), pension, unemployment, long-term care insurance",
      "Works council (Betriebsrat) consultation rights at 5+ employees",
      "Detailed Arbeitsvertrag (employment contract) — must specify protective terms",
      "Datenschutzbeauftragter (DPO) at 20+ employees handling personal data"
    ],
    common_pitfalls: [
      "Scheinselbständigkeit (false self-employment) — multi-criteria test, fines up to €500K and back-payments",
      "AÜG licensing for staffing — without it, hires can be challenged",
      "Termination requires Sozialauswahl (social selection) for cos with 10+ employees",
      "Probezeit (probation) max 6 months, after that termination protection kicks in"
    ],
    tax_burden_employer: "~21% (split: pension 9.3%, unemployment 1.3%, health 7.3-8%, long-term care 1.7-2%)",
    notable_employee_protections: [
      "Strong termination protection after 6 months at 10+ employee orgs",
      "20-30 days minimum vacation",
      "Continued pay during sickness (6 weeks employer-paid)",
      "Works council can block major HR decisions"
    ]
  },
  france: {
    market: "France",
    flag: "🇫🇷",
    legal_framework: "Code du Travail. Among most employee-protective in Europe. CDI (permanent) heavily preferred over CDD (fixed).",
    typical_eor_markup: "13-20%",
    entity_setup_cost_usd: "$12K-35K (SARL/SAS + commercial registry + ongoing comptable)",
    entity_setup_time: "6-12 weeks",
    typical_eor_breakeven_employees: "8-12 employees",
    payroll_complexity: "Very High",
    must_haves: [
      "URSSAF social security registration",
      "Convention collective (industry-wide collective agreement) compliance",
      "Mutuelle (health complement) employer-paid 50% min",
      "Comité Social et Économique (CSE) at 11+ employees",
      "Document Unique d'Évaluation des Risques (workplace risk assessment)"
    ],
    common_pitfalls: [
      "Travail dissimulé (concealed work / contractor misclassification) — 3 yrs prison + heavy fines possible",
      "35-hour week + RTT compliance",
      "Termination process is procedural — wrong steps invalidate it entirely",
      "CDD strict justification or auto-converts to CDI"
    ],
    tax_burden_employer: "~42-45% (highest in EU — unemployment, pension, family allowance, training)",
    notable_employee_protections: [
      "Termination procedure required: written notice, hearing, justification",
      "30 days vacation + 11 public holidays + RTT",
      "Right to disconnect (Loi Travail 2016)",
      "Maternity 16-26 weeks paid"
    ]
  },
  netherlands: {
    market: "Netherlands",
    flag: "🇳🇱",
    legal_framework: "Burgerlijk Wetboek Boek 7 (Civil Code), Wet werk en zekerheid (Work and Security Act).",
    typical_eor_markup: "10-15%",
    entity_setup_cost_usd: "$8K-20K (BV + notary + ongoing accountant)",
    entity_setup_time: "4-8 weeks",
    typical_eor_breakeven_employees: "5-8 employees",
    payroll_complexity: "Medium",
    must_haves: [
      "Belastingdienst (tax authority) registration",
      "Pension via Pensioenfonds (industry pension fund often mandatory)",
      "Holiday allowance: 8% on top of salary, paid in May",
      "30% ruling for international hires (tax-advantaged)"
    ],
    common_pitfalls: [
      "Wet DBA — false self-employment law; ZZP/contractor relationships scrutinized",
      "Transition payment (transitievergoeding) on dismissal: 1/3 month salary per year",
      "Industry CAOs (collective agreements) often mandatory by sector"
    ],
    tax_burden_employer: "~20-25% (social security, pension, unemployment)",
    notable_employee_protections: [
      "Transition payment due on most terminations regardless of fault",
      "20 days minimum vacation",
      "Strong sick pay obligations (employer pays 70% for up to 2 yrs)"
    ]
  },
  nordics: {
    market: "Nordics (Sweden, Denmark, Norway, Finland)",
    flag: "🇸🇪",
    legal_framework: "Each country has own framework but shares Nordic Model: collective agreements (kollektivavtal), strong unions, high taxes, strong worker protections.",
    typical_eor_markup: "10-15%",
    entity_setup_cost_usd: "$10K-30K per country",
    entity_setup_time: "4-10 weeks per country",
    typical_eor_breakeven_employees: "5-10 employees",
    payroll_complexity: "High",
    must_haves: [
      "Country-specific tax/social security registration (e.g. Skatteverket in Sweden)",
      "Union/collective agreement compliance — most workplaces are covered",
      "Pension contributions (e.g. ITP in Sweden ~31.5%)",
      "5+ weeks vacation standard"
    ],
    common_pitfalls: [
      "Treating all 4 countries as one — they have separate systems",
      "Skipping union dialogue (kollektivavtal) — major reputational issue",
      "Norway is non-EU/EEA member — different rules"
    ],
    tax_burden_employer: "Sweden ~31.4% (social fee), Denmark lower (~0.5% but higher individual taxes), Norway ~14.1%, Finland ~22%",
    notable_employee_protections: [
      "Robust union representation rights",
      "5+ weeks vacation",
      "Long parental leave (Sweden 480 days shared)",
      "High sickness benefit"
    ]
  },
  mexico: {
    market: "Mexico",
    flag: "🇲🇽",
    legal_framework: "Ley Federal del Trabajo (LFT). 2021 reform restricted outsourcing — now must use REPSE-registered providers.",
    typical_eor_markup: "12-18%",
    entity_setup_cost_usd: "$8K-25K (S de RL + IMSS, INFONAVIT, SAT registration)",
    entity_setup_time: "6-12 weeks",
    typical_eor_breakeven_employees: "8-12 employees",
    payroll_complexity: "High",
    must_haves: [
      "IMSS (social security) and INFONAVIT (housing) registration",
      "Aguinaldo (Christmas bonus) of 15 days minimum",
      "Profit sharing (PTU): 10% of profits to workforce",
      "REPSE registration for any specialized services provider"
    ],
    common_pitfalls: [
      "2021 outsourcing reform criminalized non-REPSE providers",
      "Indemnización constitucional: 3 months salary on unjustified termination",
      "Vacaciones doubled in 2023 reform: now 12 days starting year 1"
    ],
    tax_burden_employer: "~25-35% (IMSS, INFONAVIT, SAR, state payroll tax 2-3%)",
    notable_employee_protections: [
      "PTU profit sharing required",
      "Aguinaldo Christmas bonus mandatory",
      "Vacation premium 25% on top of vacation pay"
    ]
  },
  brazil: {
    market: "Brazil",
    flag: "🇧🇷",
    legal_framework: "CLT (Consolidação das Leis do Trabalho). Among most complex labor codes globally.",
    typical_eor_markup: "15-25%",
    entity_setup_cost_usd: "$15K-50K (Ltda + multiple registrations + local director)",
    entity_setup_time: "10-20 weeks",
    typical_eor_breakeven_employees: "12-20 employees",
    payroll_complexity: "Very High",
    must_haves: [
      "CNPJ + INSS + FGTS (severance fund) registrations",
      "13th salary (Christmas bonus = 1 month extra)",
      "Vacation + 1/3 vacation bonus",
      "FGTS deposit: 8% of salary monthly to govt fund",
      "eSocial reporting (real-time payroll/HR data)"
    ],
    common_pitfalls: [
      "PJ/MEI (contractor) misclassification = vínculo empregatício recognition with full back-payment of employee rights",
      "Termination is expensive: FGTS + 40% penalty + aviso prévio",
      "Labor courts heavily favor employees"
    ],
    tax_burden_employer: "~30-40% (INSS, FGTS, salário-educação, RAT, terceiros)",
    notable_employee_protections: [
      "13th salary mandatory",
      "30 days vacation + 1/3 bonus",
      "FGTS gives 40% severance penalty on dismissal without cause",
      "Stability for pregnant workers, union reps, etc."
    ]
  },
  india: {
    market: "India",
    flag: "🇮🇳",
    legal_framework: "Industrial Disputes Act, Shops & Establishments Act (state-level), Code on Wages 2019, EPF/ESI laws. Wide regional variation.",
    typical_eor_markup: "10-15%",
    entity_setup_cost_usd: "$5K-15K (Pvt Ltd + GST + EPF + ESI registrations)",
    entity_setup_time: "6-10 weeks",
    typical_eor_breakeven_employees: "10-15 employees",
    payroll_complexity: "High",
    must_haves: [
      "PAN, TAN, GST registration",
      "EPF (Provident Fund): 12% employer + 12% employee contribution",
      "ESI (Employee State Insurance) for salaries below threshold",
      "Gratuity reserves: 4.81% of basic salary",
      "Professional Tax (state-level)"
    ],
    common_pitfalls: [
      "State-level Shops & Establishments Acts vary widely",
      "Misclassification of consultants vs employees increasingly enforced",
      "Termination of \"workmen\" requires government permission at 100+ employees"
    ],
    tax_burden_employer: "~22-25% (EPF + gratuity + ESI + LWF)",
    notable_employee_protections: [
      "Gratuity payable after 5 yrs of service",
      "Statutory bonus 8.33-20% for eligible employees",
      "Maternity 26 weeks paid"
    ]
  },
  japan: {
    market: "Japan",
    flag: "🇯🇵",
    legal_framework: "Labor Standards Act, Labor Contract Act. Very employee-protective. Lifetime employment culturally embedded.",
    typical_eor_markup: "12-18%",
    entity_setup_cost_usd: "$10K-30K (KK or Godo Kaisha + capital + Hanko + tax adviser)",
    entity_setup_time: "8-12 weeks",
    typical_eor_breakeven_employees: "8-15 employees",
    payroll_complexity: "High",
    must_haves: [
      "Social Insurance (健康保険 + 厚生年金 + 雇用保険 + 労災)",
      "Bonus expectations (typically 2-5 months/year extra)",
      "Detailed employment contract (Rōdō Jōken Tsūchisho)",
      "Mandatory medical checkup annually"
    ],
    common_pitfalls: [
      "Termination is extremely difficult — courts almost always side with employee",
      "PIPs and resign-by-mutual-agreement is common workaround",
      "Outsourcing to gyōmu itaku (contractor) heavily scrutinized for ' disguised employment'"
    ],
    tax_burden_employer: "~15-16% (split with employee; pension, health, unemployment, accident)",
    notable_employee_protections: [
      "Termination requires \"objectively reasonable grounds\" — practically impossible without cause",
      "Bonus expectations baked into compensation expectations",
      "Strict overtime rules (45 hr/mo max overtime ordinarily)"
    ]
  },
  singapore: {
    market: "Singapore",
    flag: "🇸🇬",
    legal_framework: "Employment Act, CPF Act, Employment of Foreign Manpower Act. Pro-business, English-language, fast.",
    typical_eor_markup: "8-12%",
    entity_setup_cost_usd: "$3K-10K (Pte Ltd + ACRA + nominee director if no local)",
    entity_setup_time: "1-3 weeks (fastest in this list)",
    typical_eor_breakeven_employees: "3-5 employees",
    payroll_complexity: "Low",
    must_haves: [
      "ACRA (Companies Act) + CPF (Central Provident Fund) registration",
      "CPF contributions: 17% employer + 20% employee for citizens/PRs (under 55)",
      "Work pass (Employment Pass / S Pass) for foreigners",
      "Skills Development Levy (SDL) 0.25% min"
    ],
    common_pitfalls: [
      "Foreign Worker Levy / quotas for non-EP holders",
      "MOM (Ministry of Manpower) vigilant on undocumented work",
      "Contractor misclassification cases growing under IRAS scrutiny"
    ],
    tax_burden_employer: "~17-17.5% (CPF + SDL); zero CPF for foreigners on EP/S Pass",
    notable_employee_protections: [
      "Termination relatively flexible vs other Asia-Pacific markets",
      "7-14 days annual leave statutory minimum (often topped up)",
      "Maternity 16 weeks paid (govt + employer)"
    ]
  }
};

// =====================================================
// MISCLASSIFICATION RISK
// =====================================================

const MISCLASSIFICATION_RISK: Record<string, {
  risk_level: string,
  legal_test: string,
  enforcement_authority: string,
  typical_penalty: string,
  retroactive_liability: string,
  recent_enforcement_examples: string[],
  red_flags: string[],
  safer_path: string
}> = {
  uk: {
    risk_level: "High",
    legal_test: "IR35 status determination — Mutuality of Obligation, Personal Service, Control. Plus CEST tool from HMRC.",
    enforcement_authority: "HMRC + Employment Tribunal",
    typical_penalty: "Backpay of taxes + NI + interest + 0-100% penalty",
    retroactive_liability: "Up to 4 years (6 if deliberate)",
    recent_enforcement_examples: [
      "Multiple BBC presenters reclassified as employees post-IR35",
      "Pimlico Plumbers Supreme Court case re: worker status"
    ],
    red_flags: [
      "Same contractor working >2 yrs full-time exclusively",
      "Set hours, embedded in team, uses company equipment",
      "No right of substitution"
    ],
    safer_path: "EOR for true employee relationships. Genuine B2B contractor only with Statement of Work + multiple clients + own tools"
  },
  germany: {
    risk_level: "Critical",
    legal_test: "Scheinselbständigkeit / Statusfeststellungsverfahren — multi-factor test by Deutsche Rentenversicherung. Personal dependence, no entrepreneurial risk, integration into client.",
    enforcement_authority: "Deutsche Rentenversicherung Bund + tax office + Hauptzollamt",
    typical_penalty: "Up to 4 yrs back social security (employer + employee shares) + interest + criminal liability for principal",
    retroactive_liability: "Up to 4 years (30 yrs in fraud cases)",
    recent_enforcement_examples: [
      "Many crowd-working / gig platforms (Helpling, Foodora) reclassified",
      "Engineering consultants commonly caught"
    ],
    red_flags: [
      "Single client representing >5/6ths of contractor revenue",
      "Working from client premises with client equipment",
      "Fixed working hours imposed by client",
      "Reporting to a manager"
    ],
    safer_path: "EOR is the safe bet. Real Selbständigkeit requires multiple clients, own tools, own risk."
  },
  france: {
    risk_level: "Critical",
    legal_test: "Travail dissimulé (concealed employment). Lien de subordination (subordination link) test.",
    enforcement_authority: "URSSAF + Inspection du Travail + criminal courts",
    typical_penalty: "Up to 5 yrs back social security + 45,000€ fine + 3 yrs prison for principal",
    retroactive_liability: "Up to 5 years",
    recent_enforcement_examples: [
      "Uber drivers reclassified by Cour de Cassation 2020",
      "Deliveroo France criminal conviction"
    ],
    red_flags: [
      "Subordination — fixed hours, set tasks, no autonomy",
      "Long-term single-client relationship",
      "Use of client tools, branding, email"
    ],
    safer_path: "EOR for any worker integrated into the team. Portage salarial as alternative for senior independents."
  },
  spain: {
    risk_level: "Critical",
    legal_test: "Falso autónomo test. Inspección de Trabajo applies indices: dependence, exclusivity, integration.",
    enforcement_authority: "Inspección de Trabajo y Seguridad Social",
    typical_penalty: "Backpay social security + fine 626-187,515€ per worker + criminal liability for serious cases",
    retroactive_liability: "Up to 4 years",
    recent_enforcement_examples: [
      "Glovo riders nationally reclassified (Riders Law 2021)",
      "Major fines on consultancies misclassifying programmers"
    ],
    red_flags: [
      "TRADE (Trabajador Autónomo Económicamente Dependiente) territory: 75%+ revenue from one client",
      "Schedule, location, deliverables dictated by client",
      "Worker doesn't bear business risk"
    ],
    safer_path: "EOR or proper TRADE contract with explicit acknowledgment + protections"
  },
  netherlands: {
    risk_level: "High",
    legal_test: "Wet DBA (Deregulation Assessment of Working Relationships Act). Authority, embedded work, personal performance.",
    enforcement_authority: "Belastingdienst (tax authority)",
    typical_penalty: "Backpay payroll tax + social security + ~25-100% surcharge",
    retroactive_liability: "Up to 5 years",
    recent_enforcement_examples: [
      "Deliveroo couriers reclassified (Supreme Court 2023)",
      "Many platform workers under scrutiny"
    ],
    red_flags: [
      "ZZP working for one client long-term",
      "No real entrepreneurial risk",
      "Client controls how work is done"
    ],
    safer_path: "Modelovereenkomst (model agreement) approved by tax authority + multi-client reality, OR EOR"
  },
  mexico: {
    risk_level: "Critical (post 2021 reform)",
    legal_test: "LFT defines vínculo laboral: subordination, salary, personal service. 2021 reform criminalized non-REPSE outsourcing.",
    enforcement_authority: "STPS (Labor Ministry) + IMSS + SAT",
    typical_penalty: "Backpay employee benefits (PTU, vacation, aguinaldo, IMSS, INFONAVIT) + fines + criminal for non-REPSE",
    retroactive_liability: "5 years",
    recent_enforcement_examples: [
      "Massive 2021 reclassifications post-outsourcing reform",
      "Many tech companies fined"
    ],
    red_flags: [
      "Independent contractor with single client + subordination",
      "Use of client tools, branding",
      "Specialized services without REPSE registration of provider"
    ],
    safer_path: "EOR through REPSE-registered provider OR direct hire"
  },
  brazil: {
    risk_level: "Critical",
    legal_test: "CLT vínculo empregatício recognition: pessoalidade, habitualidade, onerosidade, subordinação.",
    enforcement_authority: "Justiça do Trabalho (Labor Courts) + Ministério do Trabalho",
    typical_penalty: "Backpay all CLT rights (FGTS, 13th, vacation, PIS, INSS) + 40% FGTS penalty + 50% sometimes punitive",
    retroactive_liability: "5 years (rolling)",
    recent_enforcement_examples: [
      "Numerous PJ-to-CLT reclassifications in IT/tech",
      "Many platform delivery workers cases ongoing"
    ],
    red_flags: [
      "PJ contractor working full-time exclusively for years",
      "Use of company email, equipment",
      "Reporting structure same as employees"
    ],
    safer_path: "EOR (CLT) or strict PJ with multiple clients + entrepreneurial reality"
  },
  ireland: { risk_level: "Medium", legal_test: "WRC Code of Practice + 2021 Code on Determining Employment Status", enforcement_authority: "Revenue + WRC + DSP", typical_penalty: "Backpay PAYE + PRSI + USC + interest + penalties", retroactive_liability: "4 years", recent_enforcement_examples: ["Domino's Pizza drivers reclassified 2023"], red_flags: ["Long-term single client engagement", "Fixed hours, premises"], safer_path: "EOR or genuine contractor with multiple clients" },
  india: { risk_level: "Medium", legal_test: "Industrial Disputes Act 'workman' definition + control & integration tests", enforcement_authority: "Labor Department + EPFO + GST", typical_penalty: "Backpay EPF + ESI + gratuity + interest", retroactive_liability: "3-5 years", recent_enforcement_examples: ["Multiple IT consultancy reclassifications under EPFO"], red_flags: ["Long-term consultant on payroll-like arrangement"], safer_path: "EOR or true freelancer with multiple clients" },
  japan: { risk_level: "Medium-High", legal_test: "Disguised employment (gisō ukeoi) test by Labor Standards Inspection Office", enforcement_authority: "Ministry of Health, Labor, and Welfare", typical_penalty: "Backpay social insurance + reputational damage", retroactive_liability: "5 years", recent_enforcement_examples: ["Several gyōmu itaku contracts reclassified"], red_flags: ["Long-term contractor in subordinate relationship"], safer_path: "EOR or true independent" },
  singapore: { risk_level: "Low-Medium", legal_test: "MOM/IRAS examines control, financial dependence, personal service", enforcement_authority: "MOM + IRAS + CPF Board", typical_penalty: "Backpay CPF + tax + fines", retroactive_liability: "5 years", recent_enforcement_examples: ["Several tech contractor reclassifications 2023-25"], red_flags: ["Single-client long-term arrangement"], safer_path: "EOR or properly structured contractor" },
  nordics: { risk_level: "High", legal_test: "Each country has own test — generally personal subordination, exclusivity, integration. Strong union involvement.", enforcement_authority: "Skatteverket (SE), Skatteetaten (NO), etc.", typical_penalty: "Backpay social fees + tax + arbetsgivaravgift + penalties", retroactive_liability: "Up to 6 years (varies)", recent_enforcement_examples: ["Foodora couriers Sweden/Norway reclassifications"], red_flags: ["Long-term single client", "No real entrepreneurial risk"], safer_path: "EOR with kollektivavtal compliance" }
};

// =====================================================
// EOR vs ENTITY CALCULATOR
// =====================================================

function calcEorVsEntity(country: string, headcount: number, salaryUsd: number) {
  const brief = COUNTRY_BRIEFS[country];
  if (!brief) return { error: `Unknown country: ${country}` };

  // Parse markup percentage range — take midpoint
  const markupMatch = brief.typical_eor_markup.match(/(\d+)-(\d+)/);
  const markupPct = markupMatch ? (parseInt(markupMatch[1]) + parseInt(markupMatch[2])) / 200 : 0.13;

  // Parse entity setup cost — take midpoint
  const setupMatch = brief.entity_setup_cost_usd.match(/\$([0-9KkMm,]+)-([0-9KkMm,]+)/);
  const parseAmount = (s: string) => {
    const num = parseFloat(s.replace(/[Kk,]/g, ""));
    return s.toLowerCase().includes("k") ? num * 1000 : num;
  };
  const entitySetupMid = setupMatch ? (parseAmount(setupMatch[1]) + parseAmount(setupMatch[2])) / 2 : 15000;

  // Parse breakeven
  const beMatch = brief.typical_eor_breakeven_employees.match(/(\d+)-(\d+)/);
  const breakeven = beMatch ? Math.round((parseInt(beMatch[1]) + parseInt(beMatch[2])) / 2) : 8;

  const annualPayroll = headcount * salaryUsd;
  const eorAnnualCost = annualPayroll * markupPct;
  const entityAnnualOngoing = 24000; // ~$2K/mo accounting + legal + tax filings
  const entityYear1 = entitySetupMid + entityAnnualOngoing;
  const entityYear2Plus = entityAnnualOngoing;
  const eor3Year = eorAnnualCost * 3;
  const entity3Year = entitySetupMid + entityAnnualOngoing * 3;

  const recommendation = headcount < breakeven
    ? `EOR — at ${headcount} employees you're below the typical break-even of ~${breakeven} for ${brief.market}. Entity setup costs (~$${entitySetupMid.toLocaleString()}) and ongoing complexity outweigh the markup savings.`
    : headcount === breakeven
      ? `Borderline — at exactly ${breakeven} employees you're at the typical break-even. Stay on EOR if growth is uncertain. Switch to entity if you're committed to scaling 2x+ in the country.`
      : `Entity — at ${headcount} employees you're above the typical break-even of ~${breakeven}. Long-term, an entity is more cost-effective. EOR remains useful for the transition period (~3-6 mo).`;

  return {
    country: brief.market,
    inputs: { headcount, annual_salary_usd: salaryUsd },
    eor: {
      annual_markup: `~${(markupPct * 100).toFixed(0)}% on payroll`,
      annual_cost_usd: Math.round(eorAnnualCost),
      cost_3yr_usd: Math.round(eor3Year),
      pros: ["Compliant from day 1", "No entity setup", "Easy exit if not scaling"],
      cons: ["Markup eats into margin", "Less control over benefits/perks", "Can't customize payroll"]
    },
    entity: {
      setup_cost_usd: Math.round(entitySetupMid),
      annual_ongoing_usd: entityAnnualOngoing,
      year1_total_usd: Math.round(entityYear1),
      cost_3yr_usd: Math.round(entity3Year),
      pros: ["Lower long-term cost at scale", "Full control of HR, benefits, branding", "Local presence/credibility"],
      cons: [`Setup time: ${brief.entity_setup_time}`, "Ongoing compliance burden", "Cannot easily exit"]
    },
    breakeven_estimate: `~${breakeven} employees`,
    recommendation,
    payroll_complexity: brief.payroll_complexity
  };
}

// =====================================================
// EOR OBJECTION HANDLERS
// =====================================================

const EOR_OBJECTION_HANDLERS: Record<string, any> = {
  use_contractors_instead: {
    objection: "We'll just hire as contractors instead of EOR",
    psychology: "Optimizing for cost without seeing misclassification risk",
    response: `That's a common path — the catch is misclassification risk. In Germany, France, Spain, Mexico, and Brazil, if a contractor is found to function as an employee (continuous work, exclusivity, subordination), the back-payment of social contributions, fines, and retroactive employee rights can be 5-10x what you saved.

EOR removes that risk entirely. Worth a quick look at your specific exposure?`,
    high_risk_countries: ["germany", "france", "spain", "mexico", "brazil"],
    medium_risk_countries: ["uk", "netherlands", "japan", "nordics"],
    follow_up: "Offer free 15-min misclassification risk audit specific to their target country",
    mistake_to_avoid: "Don't fearmonger — name actual mechanisms (Scheinselbständigkeit in DE, falso autónomo in ES, vínculo empregatício in BR)"
  },
  not_ready_to_commit: {
    objection: "We're not ready to commit to a permanent hire in [country]",
    psychology: "Fear of getting stuck",
    response: `That's actually exactly when EOR is most useful. EOR lets you hire someone in [country] without a legal entity, AND you can terminate the arrangement with much lower risk than direct hire — typically 30-60 day notice depending on country.

It's literally designed for the 'we want to test this market' situation. What's your timeline for getting this person started?`,
    follow_up: "Frame as 'low-commitment trial' rather than 'first step to bigger commitment'",
    mistake_to_avoid: "Don't push toward permanence — embrace the trial framing"
  },
  too_expensive: {
    objection: "EOR markup is too expensive vs direct hire",
    psychology: "Comparing apples to oranges — direct hire excludes setup costs",
    response: `Fair to ask. Quick math: setting up a legal entity in [country] typically costs $8K-50K upfront (lawyers, accountants, registration), takes 4-12 weeks, plus ongoing compliance ($1-3K/mo).

EOR gets you compliant in 7-14 days for typically 10-15% markup. For 1-3 hires per country, EOR is dramatically cheaper. Break-even vs entity is usually 5-15 employees.

How many hires are you planning in [country] over the next 12 months?`,
    follow_up: "Use their headcount projection to do live ROI math (use get_eor_vs_entity_calc)",
    mistake_to_avoid: "Don't argue percentage markup — argue total cost of ownership"
  },
  we_have_entity: {
    objection: "We already have a legal entity in [country], we don't need EOR",
    psychology: "Entity might be 'paper only' without operational HR/payroll",
    response: `That's great. Quick clarifying questions: does your entity have local payroll, statutory benefits administration, employment contract templates that comply with [country] labor law, and someone managing local HR queries from employees?

If yes, EOR is unnecessary. If you're outsourcing any of that to local accountants or law firms, EOR often consolidates those costs into one bill — and reduces compliance risk.`,
    follow_up: "Use their answers to identify gaps where EOR adds value despite their entity",
    mistake_to_avoid: "Don't assume their entity is fully operational"
  },
  compliance_unclear: {
    objection: "I'm not sure if EOR is even legal/proper in [country]",
    psychology: "Risk-averse buyer wants reassurance",
    response: `Totally fair — and good instinct to ask. EOR is legally established and standard in [country]. The arrangement: the EOR provider is the legal employer of record (handling all compliance, taxes, social contributions, statutory benefits), and your company directs the employee's work.

In [country] specifically, [country-specific framework: Germany's AÜG for staffing, France's portage salarial, Mexico's REPSE, etc.]

I can share specific legal framework and case law. Want me to send that over?`,
    follow_up: "Send country-specific compliance whitepaper or send to their legal team",
    mistake_to_avoid: "Don't be vague about legal framework — name the actual statute"
  },
  termination_concerns: {
    objection: "What happens if we need to fire the EOR-hired employee?",
    psychology: "Fear of being stuck with an underperformer",
    response: `Termination through EOR is actually easier than through your own entity, in most cases. The EOR handles the legal process per [country] requirements — notice periods, severance calculations, documentation, exit interviews.

The EOR's job is to make termination smooth and legally compliant for you. They have local employment law specialists.

The country matters though — what country are we talking about? Termination in Germany or Brazil is more involved than in Singapore or Netherlands. Want me to walk through the specific country?`,
    follow_up: "Use get_termination_rules tool for country-specific timeline + cost",
    mistake_to_avoid: "Don't promise easy termination in countries where it's structurally difficult (DE, JP, BR)"
  },
  data_privacy_worry: {
    objection: "What about GDPR / data privacy? We're worried about HR data going through a third party.",
    psychology: "Compliance-aware buyer, often EU-based",
    response: `Excellent question — and exactly the right thing to worry about. Reputable EOR providers operate as data processors under GDPR, with Data Processing Agreements (DPAs) that specify exactly what they do with HR data.

In Germany specifically, EORs need to comply with BDSG plus GDPR, plus often serve as the works council interlocutor.

Want to see our standard DPA template? We can also customize for your specific data residency requirements.`,
    follow_up: "Send DPA template, offer privacy team alignment call",
    mistake_to_avoid: "Don't dismiss the concern — they're right to ask"
  },
  competitor_offer: {
    objection: "Deel/Remote/Velocity Global offered us a better price",
    psychology: "Negotiating, but also might be true",
    response: `Fair — they're solid players. Three things matter beyond price: country coverage depth, local HR expertise quality, and how they handle the messy stuff (terminations, disputes, audits).

Three questions for you: 1) which countries are most important? 2) have you stress-tested their support response time? 3) what's their take on misclassification risk for your specific contractor situation?

If they're truly cheaper AND better on all three, take their offer. If we differentiate on any of those, the price difference might be worth it.`,
    follow_up: "Always lean into discovery vs. price-matching",
    mistake_to_avoid: "Don't immediately discount — discover why they're shopping first"
  }
};

// =====================================================
// SERVER SETUP
// =====================================================

const server = new Server(
  { name: "eor-compliance-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_country_eor_brief",
      description: "Get country-specific EOR brief: legal framework, typical markup, entity setup cost/time, break-even employee count, payroll complexity, must-haves, common pitfalls, employer tax burden, employee protections.",
      inputSchema: { type: "object", properties: { country: { type: "string", enum: Object.keys(COUNTRY_BRIEFS) } }, required: ["country"] }
    },
    {
      name: "get_misclassification_risk",
      description: "Country-specific misclassification (false self-employment) risk analysis. Returns risk level, legal test, enforcement authority, typical penalty, retroactive liability period, recent enforcement examples, red flags, safer path.",
      inputSchema: { type: "object", properties: { country: { type: "string", enum: Object.keys(MISCLASSIFICATION_RISK) } }, required: ["country"] }
    },
    {
      name: "get_eor_vs_entity_calc",
      description: "Live calculation of EOR vs setting up your own legal entity given headcount + salary. Returns 1-yr and 3-yr cost comparison, recommendation, break-even estimate, pros/cons.",
      inputSchema: {
        type: "object",
        properties: {
          country: { type: "string", enum: Object.keys(COUNTRY_BRIEFS) },
          headcount: { type: "integer", minimum: 1 },
          annual_salary_usd: { type: "integer", minimum: 10000 }
        },
        required: ["country", "headcount", "annual_salary_usd"]
      }
    },
    {
      name: "get_termination_rules",
      description: "Country-specific termination rules including notice period, severance calculation, just-cause requirements, and procedural pitfalls.",
      inputSchema: { type: "object", properties: { country: { type: "string", enum: Object.keys(COUNTRY_BRIEFS) } }, required: ["country"] }
    },
    {
      name: "get_statutory_benefits",
      description: "Required statutory benefits per country: pension, health, vacation, holidays, parental leave, 13th salary, bonuses.",
      inputSchema: { type: "object", properties: { country: { type: "string", enum: Object.keys(COUNTRY_BRIEFS) } }, required: ["country"] }
    },
    {
      name: "get_visa_paths",
      description: "Work visa / right-to-work paths per country for hiring foreigners. Visa types, cost, timeline, sponsorship requirements.",
      inputSchema: { type: "object", properties: { country: { type: "string", enum: Object.keys(COUNTRY_BRIEFS) } }, required: ["country"] }
    },
    {
      name: "get_eor_objection_handler",
      description: "Handle EOR sales objections with battle-tested responses. 8 objection types: use_contractors_instead, not_ready_to_commit, too_expensive, we_have_entity, compliance_unclear, termination_concerns, data_privacy_worry, competitor_offer.",
      inputSchema: { type: "object", properties: { objection_type: { type: "string", enum: Object.keys(EOR_OBJECTION_HANDLERS) } }, required: ["objection_type"] }
    },
    {
      name: "get_full_eor_pack",
      description: "Complete EOR intelligence pack — all country briefs, misclassification risks, objection handlers. For agent fine-tuning or full system context.",
      inputSchema: { type: "object", properties: {}, required: [] }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_country_eor_brief": {
      const country = args?.country as string;
      const brief = COUNTRY_BRIEFS[country];
      if (!brief) throw new Error(`Unknown country: ${country}`);
      return { content: [{ type: "text", text: JSON.stringify({ module: "EOR Country Brief", ...brief }, null, 2) }] };
    }

    case "get_misclassification_risk": {
      const country = args?.country as string;
      const risk = MISCLASSIFICATION_RISK[country];
      if (!risk) throw new Error(`Unknown country: ${country}`);
      return { content: [{ type: "text", text: JSON.stringify({ module: "Misclassification Risk", country, ...risk }, null, 2) }] };
    }

    case "get_eor_vs_entity_calc": {
      const country = args?.country as string;
      const headcount = args?.headcount as number;
      const salaryUsd = args?.annual_salary_usd as number;
      const result = calcEorVsEntity(country, headcount, salaryUsd);
      return { content: [{ type: "text", text: JSON.stringify({ module: "EOR vs Entity Calculator", ...result }, null, 2) }] };
    }

    case "get_termination_rules": {
      const country = args?.country as string;
      const brief = COUNTRY_BRIEFS[country];
      if (!brief) throw new Error(`Unknown country: ${country}`);
      return {
        content: [{
          type: "text", text: JSON.stringify({
            module: "Termination Rules",
            country: brief.market,
            legal_framework: brief.legal_framework,
            employee_protections: brief.notable_employee_protections,
            common_pitfalls: brief.common_pitfalls.filter(p => /termination|dismissal|fire|sever|notice|protection/i.test(p)),
            general_guidance: brief.payroll_complexity === "Very High" || brief.payroll_complexity === "High"
              ? "High-complexity termination market — formal process required, severance significant, courts often pro-employee. Use EOR for hands-off compliance."
              : "Lower-complexity termination market — process is more streamlined but still respect notice periods."
          }, null, 2)
        }]
      };
    }

    case "get_statutory_benefits": {
      const country = args?.country as string;
      const brief = COUNTRY_BRIEFS[country];
      if (!brief) throw new Error(`Unknown country: ${country}`);
      return {
        content: [{
          type: "text", text: JSON.stringify({
            module: "Statutory Benefits",
            country: brief.market,
            required: brief.must_haves,
            employer_tax_burden: brief.tax_burden_employer,
            employee_protections: brief.notable_employee_protections
          }, null, 2)
        }]
      };
    }

    case "get_visa_paths": {
      const country = args?.country as string;
      const brief = COUNTRY_BRIEFS[country];
      if (!brief) throw new Error(`Unknown country: ${country}`);
      const visaInfo: Record<string, any> = {
        uk: { types: ["Skilled Worker visa", "Global Talent", "Health & Care Worker"], sponsor_licence_required: true, cost_usd: "$1.5K-5K + IHS surcharge", timeline: "3-8 weeks" },
        ireland: { types: ["Critical Skills Employment Permit", "General Employment Permit"], sponsor_licence_required: false, cost_usd: "$1K-2K", timeline: "4-12 weeks" },
        germany: { types: ["EU Blue Card", "Skilled Workers visa", "Job Seeker visa"], sponsor_licence_required: false, cost_usd: "$200-500", timeline: "8-16 weeks" },
        france: { types: ["Talent Passport", "Salaried Worker visa"], sponsor_licence_required: false, cost_usd: "$300-1K", timeline: "8-12 weeks" },
        spain: { types: ["Highly Qualified Professional", "Standard work visa"], sponsor_licence_required: false, cost_usd: "$200-500", timeline: "6-12 weeks" },
        netherlands: { types: ["Highly Skilled Migrant", "ICT permit", "DAFT (US/Japan citizens)"], sponsor_licence_required: true, cost_usd: "$500-2K", timeline: "4-8 weeks" },
        nordics: { types: ["Skilled Worker visa per country (Sweden, Norway, Denmark, Finland have separate)"], sponsor_licence_required: false, cost_usd: "$200-1K per country", timeline: "8-12 weeks" },
        mexico: { types: ["Temporary Resident visa with work permit", "INM permit"], sponsor_licence_required: true, cost_usd: "$400-1.5K", timeline: "8-16 weeks" },
        brazil: { types: ["Temporary Visa V (work)", "Permanent Visa"], sponsor_licence_required: true, cost_usd: "$500-2K", timeline: "10-20 weeks" },
        india: { types: ["Employment Visa (E)", "Project Visa"], sponsor_licence_required: true, cost_usd: "$200-500", timeline: "4-8 weeks" },
        japan: { types: ["Highly Skilled Professional", "Engineer/Specialist", "Intra-company Transferee"], sponsor_licence_required: true, cost_usd: "$300-1K", timeline: "4-12 weeks" },
        singapore: { types: ["Employment Pass", "S Pass", "Tech.Pass", "ONE Pass"], sponsor_licence_required: true, cost_usd: "$500-2K", timeline: "1-4 weeks (fastest in this list)" }
      };
      return {
        content: [{
          type: "text", text: JSON.stringify({
            module: "Visa & Right-to-Work Paths",
            country: brief.market,
            ...visaInfo[country],
            note: "EOR providers handle visa sponsorship as part of their service in countries where they have entities."
          }, null, 2)
        }]
      };
    }

    case "get_eor_objection_handler": {
      const objection = args?.objection_type as string;
      const handler = EOR_OBJECTION_HANDLERS[objection];
      if (!handler) throw new Error(`Unknown objection: ${objection}`);
      return { content: [{ type: "text", text: JSON.stringify({ module: "EOR Objection Handler", ...handler }, null, 2) }] };
    }

    case "get_full_eor_pack": {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            pack: "EOR Compliance MCP — Complete Pack v1.0",
            author: "Elisabeth Hitz",
            credentials: ["3+ yrs selling EOR at Deel ($12B), Multiplier", "5+ yrs EMEA enterprise sales"],
            modules: {
              country_briefs: COUNTRY_BRIEFS,
              misclassification_risk: MISCLASSIFICATION_RISK,
              objection_handlers: EOR_OBJECTION_HANDLERS
            }
          }, null, 2)
        }]
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("EOR Compliance MCP Server v1.0 running...");
}

main().catch(console.error);
