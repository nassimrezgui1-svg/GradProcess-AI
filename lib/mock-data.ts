export const demoUser = {
  id: "demo-user-1",
  name: "Alex Johnson",
  email: "alex.johnson@university.ac.uk",
  university: "University of Edinburgh",
  degree: "Finance & Economics BSc",
  graduationYear: 2025,
  targetSector: "Consulting / Banking",
  targetRole: "Graduate Analyst – Financial Services Consulting",
  targetCompanies: ["McKinsey", "Deloitte", "Goldman Sachs", "HSBC"],
  confidenceLevel: 3,
  biggestWeakness: "psychometric tests",
  avatar: null,
}

export const demoReadinessScores = {
  overall: 72,
  cv: 68,
  star: 75,
  videoInterview: 64,
  psychometric: 78,
  industryKnowledge: 70,
  fullProcessExam: 69,
  trend: [
    { date: "Week 1", score: 52 },
    { date: "Week 2", score: 58 },
    { date: "Week 3", score: 63 },
    { date: "Week 4", score: 68 },
    { date: "Week 5", score: 72 },
  ],
}

export const demoATSScore = {
  overall: 68,
  passLikelihood: "Medium risk",
  breakdown: {
    keywordMatch: 65,
    experienceRelevance: 72,
    skillsAlignment: 70,
    quantifiedImpact: 55,
    formattingReadability: 80,
    educationAlignment: 75,
    grammarClarity: 90,
  },
  matchedKeywords: [
    "financial analysis", "Excel", "PowerPoint", "stakeholder management",
    "data analysis", "team leadership", "project management"
  ],
  missingKeywords: [
    "Python", "SQL", "Bloomberg", "financial modelling", "DCF",
    "client-facing", "KPI tracking", "regulatory compliance"
  ],
  weakBullets: [
    "Helped with team projects",
    "Worked on financial reports",
    "Assisted in presentations",
  ],
  rewrittenBullets: [
    "Collaborated with a 5-member cross-functional team to deliver 3 client presentations, achieving a 95% satisfaction rating from senior stakeholders",
    "Produced monthly financial reports analysing £2M+ in departmental spend, identifying 12% cost-saving opportunities that were implemented by management",
    "Developed and delivered data-driven presentations to C-suite executives, reducing decision-making time by 30%",
  ],
  tailoredSummary: "Commercially-minded Finance & Economics graduate with demonstrated experience in financial analysis, stakeholder engagement, and data-driven decision-making. Proven ability to translate complex financial data into actionable insights, with strong quantitative skills developed through academic research and internship experience. Seeking to apply analytical rigour and consultative thinking to drive measurable impact in financial services consulting.",
  formattingWarnings: [
    "Font size inconsistency detected",
    "Consider adding a skills section",
    "Bullet points vary in length significantly"
  ],
  missingItems: [
    "Python/SQL certification",
    "Bloomberg Market Concepts",
    "Quantified revenue/cost impact in roles",
    "Industry-specific terminology"
  ],
}

export const demoSTARScenarios = [
  {
    id: "star-1",
    competency: "Leadership",
    score: 78,
    situation: "During my second year at university, I was elected President of the Finance Society with 200+ members, inheriting declining engagement and a £5,000 deficit.",
    task: "I needed to reverse the decline in membership engagement, restore financial sustainability, and position the society as a leading career-development resource on campus.",
    action: "I restructured the committee into 4 focused workstreams (events, finance, partnerships, comms), introduced weekly 1-to-1s with leads, negotiated 3 new corporate sponsors, and launched a mentorship programme pairing students with industry professionals.",
    result: "Within one academic year: membership grew 40% to 280 students, secured £8,000 in sponsorship (60% above target), hosted 12 industry events with 500+ total attendees, and the society was voted 'Best Society' at the university awards.",
    totalScore: 78,
    starCompleteness: 92,
    quantifiedOutcome: true,
    improvements: [
      "Add specific stakeholder names/companies",
      "Mention personal learning",
      "Describe one specific challenge you overcame"
    ],
  },
  {
    id: "star-2",
    competency: "Problem Solving",
    score: 71,
    situation: "During my internship at a boutique investment advisory firm, a client's quarterly report had critical errors 2 hours before a board presentation.",
    task: "Identify all errors, produce a corrected version, and brief the MD before the board meeting without causing alarm.",
    action: "I systematically audited all 47 data points against source data, identified 6 errors including two material miscalculations, rebuilt the affected sections, created a summary briefing note for the MD, and stayed late to ensure the presentation deck was updated.",
    result: "The presentation proceeded without incident. The MD cited my attention to detail in my end-of-internship review and offered to provide a reference. I was invited back for a second placement.",
    totalScore: 71,
    starCompleteness: 85,
    quantifiedOutcome: true,
    improvements: [
      "Quantify the financial impact of the errors",
      "Describe the analytical method used",
      "Add the business impact of presenting correct data"
    ],
  },
]

export const demoPsychometricSession = {
  id: "psych-1",
  type: "Numerical Reasoning",
  score: 78,
  accuracy: 78,
  questionsAttempted: 18,
  questionsCorrect: 14,
  averageTimePerQuestion: 52,
  percentileEstimate: 71,
  weakTopics: ["Percentage change", "Currency conversion"],
  strongTopics: ["Ratios", "Chart interpretation", "Averages"],
}

export const demoInterviewSession = {
  id: "interview-1",
  sector: "Consulting",
  mode: "Competency",
  overallScore: 64,
  contentScore: 68,
  deliveryScore: 60,
  bodyLanguageScore: 65,
  starScore: 72,
  commercialAwarenessScore: 58,
  roleFitScore: 66,
  confidenceScore: 62,
  questionsAnswered: 4,
  duration: "24 minutes",
  improvements: [
    "Reduce filler words ('um', 'like') — detected 12 instances",
    "Improve eye contact with camera",
    "Quantify results more specifically in STAR answers",
    "Demonstrate stronger commercial awareness in sector-specific answers",
  ],
}

export const demoIndustryScores = {
  sectors: [
    { sector: "Consulting", score: 72 },
    { sector: "Banking", score: 65 },
    { sector: "Asset Management", score: 55 },
    { sector: "Technology", score: 48 },
    { sector: "Law", score: 30 },
  ],
}

export const competencies = [
  "Leadership", "Teamwork", "Problem Solving", "Communication",
  "Conflict Resolution", "Resilience", "Adaptability", "Initiative",
  "Innovation", "Client Focus", "Stakeholder Management", "Commercial Awareness",
  "Analytical Thinking", "Data-Driven Decision-Making", "Time Management",
  "Working Under Pressure", "Ethical Judgement", "Failure and Learning",
  "Persuasion", "Ownership", "Attention to Detail", "Collaboration", "Managing Ambiguity"
]

export const sectors = [
  "Banking", "Investment Banking", "Consulting", "Asset Management",
  "Wealth Management", "Insurance", "Technology", "Law", "Engineering",
  "FMCG", "Energy", "Healthcare", "Public Sector"
]

export const psychometricTests = [
  { id: "numerical", name: "Numerical Reasoning", icon: "calculator", description: "Charts, ratios, percentages, data interpretation" },
  { id: "verbal", name: "Verbal Reasoning", icon: "book", description: "True/False/Cannot Say, inference, comprehension" },
  { id: "logical", name: "Logical Reasoning", icon: "brain", description: "Patterns, sequences, matrices, deduction" },
  { id: "abstract", name: "Abstract Reasoning", icon: "shapes", description: "Visual patterns and spatial reasoning" },
  { id: "sjt", name: "Situational Judgement", icon: "scale", description: "Workplace scenarios and professional behaviour" },
  { id: "attention", name: "Attention to Detail", icon: "eye", description: "Error spotting, data checking, accuracy" },
]

export const sampleNumericalQuestions = [
  {
    id: "q1",
    question: "A company's revenue grew from £2.4M in 2022 to £3.12M in 2023. What was the percentage increase?",
    options: ["25%", "30%", "33%", "35%"],
    correct: 1,
    explanation: "Percentage increase = (3.12 - 2.4) / 2.4 × 100 = 0.72 / 2.4 × 100 = 30%",
    difficulty: "medium",
    timeLimit: 75,
  },
  {
    id: "q2",
    question: "If a portfolio of £500,000 generates a 7.5% annual return, what is the value after 2 years (compound)?",
    options: ["£575,000", "£578,125", "£580,250", "£576,125"],
    correct: 1,
    explanation: "Year 1: 500,000 × 1.075 = 537,500. Year 2: 537,500 × 1.075 = 578,062.50 ≈ £578,125",
    difficulty: "medium",
    timeLimit: 90,
  },
  {
    id: "q3",
    question: "A fund has assets of £850M. If redemptions total £127.5M, what percentage of assets was redeemed?",
    options: ["12%", "13%", "15%", "17%"],
    correct: 2,
    explanation: "127.5 / 850 × 100 = 15%",
    difficulty: "easy",
    timeLimit: 60,
  },
  {
    id: "q4",
    question: "Three analysts share a bonus pool of £240,000 in the ratio 3:2:1. What does the highest earner receive?",
    options: ["£80,000", "£100,000", "£120,000", "£140,000"],
    correct: 2,
    explanation: "Total parts = 6. Highest share = 3/6 × 240,000 = £120,000",
    difficulty: "easy",
    timeLimit: 60,
  },
  {
    id: "q5",
    question: "A bank's cost-to-income ratio improved from 68% to 61%. If income was £1.2B, what was the cost saving?",
    options: ["£72M", "£84M", "£96M", "£108M"],
    correct: 1,
    explanation: "Old cost: 0.68 × 1.2B = £816M. New cost: 0.61 × 1.2B = £732M. Saving = £816M - £732M = £84M",
    difficulty: "hard",
    timeLimit: 90,
  },
]

export const sampleVerbalQuestions = [
  {
    id: "v1",
    passage: "Digital transformation in financial services has accelerated significantly following the COVID-19 pandemic. Traditional banks have invested heavily in mobile banking infrastructure, with the UK's five largest banks collectively spending over £8 billion on technology in 2023. This investment has driven customer adoption of digital channels, with 80% of retail banking customers now using mobile apps as their primary banking interface.",
    question: "Traditional banks collectively spent more than £8 billion on technology in 2023.",
    options: ["True", "False", "Cannot Say"],
    correct: 0,
    explanation: "The passage states 'the UK's five largest banks collectively spending over £8 billion on technology in 2023' — this is true.",
    difficulty: "easy",
  },
  {
    id: "v2",
    passage: "Digital transformation in financial services has accelerated significantly following the COVID-19 pandemic. Traditional banks have invested heavily in mobile banking infrastructure, with the UK's five largest banks collectively spending over £8 billion on technology in 2023. This investment has driven customer adoption of digital channels, with 80% of retail banking customers now using mobile apps as their primary banking interface.",
    question: "All UK bank customers now use mobile banking.",
    options: ["True", "False", "Cannot Say"],
    correct: 1,
    explanation: "The passage refers only to 'retail banking customers' and states 80%, not all. The statement is false.",
    difficulty: "medium",
  },
]

export const sampleInterviewQuestions = [
  { id: "iq1", question: "Tell me about yourself and why you're interested in this role.", type: "motivational", sector: "all" },
  { id: "iq2", question: "Why do you want to work in consulting specifically?", type: "motivational", sector: "consulting" },
  { id: "iq3", question: "Tell me about a time you led a team through a difficult challenge.", type: "competency", sector: "all" },
  { id: "iq4", question: "Tell me about a time you had to persuade someone to change their mind.", type: "competency", sector: "all" },
  { id: "iq5", question: "What do you think is the biggest challenge facing the banking sector right now?", type: "commercial", sector: "banking" },
  { id: "iq6", question: "How would you structure a business problem you've never seen before?", type: "technical", sector: "consulting" },
  { id: "iq7", question: "Tell me about a time you failed and what you learned from it.", type: "competency", sector: "all" },
  { id: "iq8", question: "Why have you chosen to apply to our firm over competitors?", type: "motivational", sector: "all" },
]

export const sectorContent: Record<string, {
  name: string
  overview: string
  trends: string[]
  clientSegments: string[]
  graduateRoles: string[]
  technicalAreas: string[]
  certifications: string[]
  commercialPrompts: string[]
  interviewQuestions: string[]
}> = {
  consulting: {
    name: "Management Consulting",
    overview: "Management consulting helps organisations improve performance through analysis of existing business problems and development of plans for improvement. Firms advise on strategy, operations, technology, and transformation.",
    trends: [
      "AI-driven transformation mandates", "ESG strategy integration", "Operating model redesign",
      "Cost optimisation programmes", "Digital product strategy", "Data & analytics modernisation"
    ],
    clientSegments: [
      "FTSE 100 corporations", "Financial services firms", "Government and public sector",
      "Healthcare organisations", "Private equity portfolio companies"
    ],
    graduateRoles: ["Analyst", "Business Analyst", "Consultant (post-MBA)", "Technology Consultant", "Strategy Analyst"],
    technicalAreas: [
      "Problem structuring (MECE)", "Issue tree frameworks", "DCF and financial modelling basics",
      "Process mapping", "Data analysis", "Presentation and storytelling"
    ],
    certifications: ["PRINCE2", "Agile/Scrum", "Lean Six Sigma", "Power BI", "Tableau", "SQL basics"],
    commercialPrompts: [
      "What is the biggest strategic challenge your target firm's clients face right now?",
      "How is AI changing the consulting business model itself?",
      "What differentiates McKinsey from BCG from Bain?",
      "What recent consulting engagements have been in the news?",
    ],
    interviewQuestions: [
      "Structure a case: A supermarket chain has seen profits fall 15% — how would you approach this?",
      "What is MECE and why does it matter in consulting?",
      "What's the difference between a strategy engagement and an operations engagement?",
      "How would you prioritise 3 recommendations for a CEO with limited budget?",
    ],
  },
  banking: {
    name: "Banking & Financial Services",
    overview: "Banking encompasses retail, commercial, investment, and transaction banking. Banks act as financial intermediaries, providing credit, capital markets services, and payment infrastructure.",
    trends: [
      "Interest rate normalisation", "AI in credit decisioning", "Open banking/API ecosystems",
      "Basel III/IV capital requirements", "Digital asset regulation", "ESG-linked lending", "Payments modernisation"
    ],
    clientSegments: [
      "Retail consumers", "SMEs", "Corporate clients", "Institutional investors", "Central banks and sovereigns"
    ],
    graduateRoles: ["Graduate Analyst", "Relationship Manager", "Credit Analyst", "Operations Analyst", "Technology Analyst", "Risk Analyst"],
    technicalAreas: [
      "Financial statements analysis", "Credit risk fundamentals", "Interest rate mechanics",
      "Capital markets basics", "KYC/AML compliance", "Regulatory framework (Basel, MiFID)"
    ],
    certifications: ["CFA Level 1", "IMC (Investment Management Certificate)", "CISI Certificate", "Bloomberg Market Concepts (BMC)", "FCA Consumer Duty awareness", "AML/KYC fundamentals"],
    commercialPrompts: [
      "What impact have recent interest rate changes had on bank profitability?",
      "How is AI changing retail banking customer experience?",
      "What is the difference between a commercial bank and an investment bank?",
      "What is Basel III and why does it matter?",
    ],
    interviewQuestions: [
      "What are the three main ways a bank makes money?",
      "Explain quantitative easing to a non-specialist.",
      "What is a credit default swap?",
      "What do you think is the biggest risk facing UK banks in the next 3 years?",
    ],
  },
  investmentbanking: {
    name: "Investment Banking",
    overview: "Investment banking advises corporations and governments on capital raising, M&A, and restructuring. Analysts work on financial modelling, pitchbooks, and transaction execution across equity and debt capital markets.",
    trends: [
      "M&A activity resurgence post rate peak", "AI in financial modelling and due diligence", "Private credit growth vs traditional lending",
      "ESG-linked bond issuance", "SPAC market evolution", "Cross-border deal complexity", "Dealmaking in technology and healthcare"
    ],
    clientSegments: [
      "FTSE 100 / Fortune 500 corporates", "Private equity sponsors", "Governments and sovereigns",
      "Family-owned businesses seeking exit", "Start-ups preparing for IPO"
    ],
    graduateRoles: ["Investment Banking Analyst (IBA)", "Capital Markets Analyst", "M&A Analyst", "ECM / DCM Analyst", "Leveraged Finance Analyst"],
    technicalAreas: [
      "DCF and LBO modelling", "Comparable company analysis (comps)", "Precedent transaction analysis",
      "Accretion/dilution analysis", "Pitchbook construction", "Capital structure fundamentals"
    ],
    certifications: ["Bloomberg Market Concepts (BMC)", "Wall Street Prep / Breaking Into Wall Street", "CFA Level 1", "CISI Corporate Finance qualification", "Excel financial modelling (FMVA)", "FCA Regulatory framework awareness"],
    commercialPrompts: [
      "What large M&A deals have been announced recently and what's driving them?",
      "Why do companies choose to raise equity vs debt?",
      "What is the difference between an IPO and a direct listing?",
      "How do rising interest rates affect M&A deal volumes?",
    ],
    interviewQuestions: [
      "Walk me through a DCF valuation.",
      "What are the three main valuation methodologies?",
      "How would you value a company with no profits?",
      "Tell me about a recent deal that caught your attention and why.",
    ],
  },
  assetmanagement: {
    name: "Asset Management",
    overview: "Asset managers invest capital on behalf of pension funds, insurers, sovereign wealth funds, and retail investors. The industry is evolving rapidly through fee compression, passive vs active debate, and ESG integration.",
    trends: [
      "Passive investing vs active fee pressure", "ESG and sustainable investing integration", "Private markets growth (private equity, infra, real assets)",
      "AI in portfolio construction", "Retail democratisation of alternative assets", "Liquidity risk post-SVB", "Tokenisation of fund assets"
    ],
    clientSegments: [
      "Pension funds", "Sovereign wealth funds", "Insurance companies", "Retail investors via platforms",
      "Endowments and foundations", "Family offices"
    ],
    graduateRoles: ["Investment Analyst", "Portfolio Analyst", "Risk Analyst", "Fund Operations Analyst", "ESG Research Analyst", "Distribution Analyst"],
    technicalAreas: [
      "Portfolio construction theory", "Risk-adjusted return metrics (Sharpe, Sortino)", "Asset allocation frameworks",
      "Fixed income duration and convexity", "Equity valuation", "Alternative assets fundamentals"
    ],
    certifications: ["CFA Level 1 (industry standard)", "IMC (Investment Management Certificate)", "Bloomberg Market Concepts (BMC)", "CAIA Level 1 (alternatives focus)", "FCA regulations and MiFID II awareness", "Python for Finance / Excel modelling"],
    commercialPrompts: [
      "Why has passive investing taken market share from active management?",
      "How do asset managers integrate ESG into portfolio decisions?",
      "What is the difference between a hedge fund and a traditional asset manager?",
      "How do rising interest rates affect a fixed income portfolio?",
    ],
    interviewQuestions: [
      "What is the efficient market hypothesis and do you agree with it?",
      "Pitch me a stock you'd buy today and why.",
      "What is the difference between alpha and beta?",
      "Explain duration risk in a bond portfolio.",
    ],
  },
  wealthmanagement: {
    name: "Wealth Management",
    overview: "Wealth management provides high-net-worth individuals and families with holistic financial advice, portfolio management, tax planning, and estate planning. Relationships are long-term and advisory-led.",
    trends: [
      "Intergenerational wealth transfer (£5.5trn in UK by 2047)", "Digital wealth platforms vs human advisors",
      "ESG and values-based investing demand", "Tax planning amid IHT reform", "AI-driven client personalisation",
      "Family office growth", "Alternative assets for HNWIs"
    ],
    clientSegments: [
      "High-net-worth individuals (£1m+ investable)", "Ultra-HNWIs and family offices",
      "Business owners post-exit", "Entrepreneurs and executives", "Inherited wealth clients"
    ],
    graduateRoles: ["Wealth Management Analyst", "Private Banking Graduate", "Financial Planning Analyst", "Client Relationship Associate", "Investment Advisory Analyst"],
    technicalAreas: [
      "Financial planning process", "Inheritance tax and estate structures", "Discretionary portfolio management",
      "Tax-efficient wrappers (ISAs, SIPPs, trusts)", "Client risk profiling", "Succession planning"
    ],
    certifications: ["CFA Level 1", "CISI Level 4 Investment Advice Diploma", "CFP (Chartered Financial Planner)", "IMC", "RDR-compliant qualifications", "Relevant FCA authorisation pathways"],
    commercialPrompts: [
      "How is the upcoming generational wealth transfer changing the industry?",
      "What are clients most concerned about given current tax and political uncertainty?",
      "How do you build trust with an HNWI client?",
      "What is the difference between discretionary and advisory portfolio management?",
    ],
    interviewQuestions: [
      "How would you approach an initial meeting with a new HNWI client?",
      "What investment products would you recommend for a risk-averse retired client?",
      "Explain inheritance tax and a common planning strategy.",
      "How do you balance client emotion with rational financial advice?",
    ],
  },
  technology: {
    name: "Technology",
    overview: "The technology sector spans software, hardware, semiconductors, cloud infrastructure, AI, and internet platforms. UK and global tech companies compete for graduate talent in product, engineering, data science, and commercial roles.",
    trends: [
      "Generative AI and LLM commercialisation", "AI regulation (EU AI Act, UK framework)", "Cloud infrastructure growth (AWS, Azure, GCP)",
      "Semiconductor supply chain onshoring", "Cybersecurity as a boardroom priority", "Fintech and embedded finance", "Developer productivity tooling"
    ],
    clientSegments: [
      "Enterprise SaaS customers", "SME software subscribers", "Consumer app users",
      "Government and public sector (GovTech)", "Developers and technical buyers"
    ],
    graduateRoles: ["Software Engineer", "Product Manager Analyst", "Data Scientist", "Business Analyst", "Solutions Consultant", "UX Researcher"],
    technicalAreas: [
      "Python / SQL fundamentals", "Cloud platforms (AWS, Azure, GCP)", "Agile and Scrum methodologies",
      "Systems design basics", "Data analysis and visualisation", "API and microservices concepts"
    ],
    certifications: ["AWS Cloud Practitioner", "Google Associate Cloud Engineer", "Microsoft Azure Fundamentals (AZ-900)", "Google Data Analytics Certificate", "CompTIA Security+", "Agile / Scrum certification"],
    commercialPrompts: [
      "How is generative AI changing the software business model?",
      "What does the EU AI Act mean for tech companies operating in Europe?",
      "Why is cybersecurity increasingly a C-suite concern?",
      "How do you evaluate whether a tech startup has a sustainable competitive advantage?",
    ],
    interviewQuestions: [
      "Explain a technical concept you find exciting to a non-technical interviewer.",
      "How would you prioritise a product roadmap with limited engineering resources?",
      "What data would you use to decide whether to launch a new product feature?",
      "What technology trend do you think is most underrated right now?",
    ],
  },
  law: {
    name: "Law",
    overview: "Commercial law firms advise on corporate transactions, litigation, regulation, and dispute resolution. Magic Circle and Silver Circle firms recruit the majority of high-achieving graduates through training contracts.",
    trends: [
      "AI and legal tech adoption (contract review, discovery)", "ESG and corporate governance disclosure requirements",
      "Cross-border M&A complexity post-Brexit", "GDPR and data privacy enforcement",
      "Sanctions and geopolitical compliance", "Alternative business structures and NewLaw models", "Mental health and wellbeing culture reform"
    ],
    clientSegments: [
      "FTSE 100 corporations", "Private equity and investment funds",
      "Governments and regulators", "High-net-worth individuals", "Start-ups and tech companies"
    ],
    graduateRoles: ["Trainee Solicitor", "Paralegal", "Legal Analyst", "Compliance Analyst", "Junior Associate (post-qualification)"],
    technicalAreas: [
      "Contract drafting and review", "Legal research methodology", "Corporate law fundamentals",
      "M&A transaction mechanics", "Regulatory and compliance frameworks", "Commercial dispute resolution"
    ],
    certifications: ["SQE 1 & 2 (Solicitors Qualifying Examination)", "LPC (Legacy route)", "GDL / Law conversion", "CILEX membership route", "CILEx Law School qualifications", "Legal tech tools (Kira, Harvey AI)"],
    commercialPrompts: [
      "How is AI changing the work of a junior solicitor?",
      "What does a training contract at a magic circle firm involve?",
      "How has Brexit affected cross-border legal work?",
      "What is the impact of the SQE on the legal profession?",
    ],
    interviewQuestions: [
      "Tell me about a recent case or deal in the news that interests you.",
      "Why commercial law over other legal careers?",
      "How would you handle a situation where a client wants advice that conflicts with regulations?",
      "What makes a great commercial solicitor beyond legal knowledge?",
    ],
  },
  insurance: {
    name: "Insurance",
    overview: "Insurance firms underwrite risk for individuals, businesses, and governments. The market spans life, general, reinsurance, and specialist lines. Lloyd's of London is the world's leading specialist insurance market.",
    trends: [
      "Climate risk modelling and nat cat losses", "Cyber insurance demand surge", "Parametric insurance products",
      "AI in underwriting and claims automation", "Embedded insurance in digital products", "Solvency II reform (UK)",
      "ESG underwriting criteria"
    ],
    clientSegments: [
      "Corporations (commercial lines)", "Retail consumers (personal lines)", "Reinsurers",
      "Governments (sovereign risk)", "Lloyd's syndicates and managing agents"
    ],
    graduateRoles: ["Graduate Underwriter", "Actuarial Analyst", "Claims Analyst", "Risk Analyst", "Graduate Broker", "Data Analyst"],
    technicalAreas: [
      "Risk assessment and pricing fundamentals", "Actuarial concepts (reserves, pricing models)",
      "Policy terms and conditions", "Claims lifecycle", "Reinsurance structures", "Regulatory capital (Solvency II)"
    ],
    certifications: ["CII (Chartered Insurance Institute) — Certificate/Diploma", "ACII (Associate of CII)", "IFoA actuarial exams (CT1–CT9 / now CM/CS/CB series)", "Lloyd's market qualifications", "Data analytics (Python, SQL)", "RiskTech tools awareness"],
    commercialPrompts: [
      "How are climate change-related losses affecting the insurance industry?",
      "What is parametric insurance and why is it growing?",
      "How has the cyber insurance market changed in the last three years?",
      "What is the role of Lloyd's of London in global insurance?",
    ],
    interviewQuestions: [
      "What is the difference between underwriting and claims?",
      "How does reinsurance work and why do insurers use it?",
      "Tell me about a risk event in the news and how an insurer would assess it.",
      "What does Solvency II require of insurance firms?",
    ],
  },
  fmcg: {
    name: "FMCG (Consumer Goods)",
    overview: "Fast-moving consumer goods companies manufacture and market everyday products — food, beverage, personal care, and household goods. Firms like Unilever, P&G, Nestlé, and Diageo compete for shelf space, brand loyalty, and digital shelf presence.",
    trends: [
      "Inflation-driven premiumisation vs value shift", "Direct-to-consumer digital channels", "Sustainability and circular packaging",
      "Health and wellness product reformulation", "Private label competition from Aldi/Lidl",
      "Supply chain resilience and nearshoring", "AI-driven demand forecasting"
    ],
    clientSegments: [
      "Retail grocery chains (Tesco, Sainsbury's, Waitrose)", "Discounters (Aldi, Lidl)",
      "E-commerce platforms (Amazon, Ocado)", "Foodservice and hospitality", "International export markets"
    ],
    graduateRoles: ["Brand Manager Trainee", "Sales Graduate", "Supply Chain Analyst", "Marketing Executive", "Category Management Analyst", "Finance Analyst"],
    technicalAreas: [
      "Brand P&L management", "Category management and shopper insight", "Sales and trade marketing",
      "Supply chain and S&OP", "Consumer research methodologies", "Pricing and promotional mechanics"
    ],
    certifications: ["CIM (Chartered Institute of Marketing) Certificate", "Google Analytics / Data Studio", "Kantar / Nielsen FMCG analytics tools", "CIPS (Chartered Institute of Procurement & Supply)", "Project management (APM/PRINCE2)", "Excel and Power BI for commercial analysis"],
    commercialPrompts: [
      "How has the cost-of-living crisis changed consumer buying behaviour?",
      "What strategies do FMCG companies use to defend market share against private label?",
      "How is Unilever / P&G balancing sustainability with profitability?",
      "What does category management mean and why does it matter?",
    ],
    interviewQuestions: [
      "Pick a product on our shelves — how would you grow its market share?",
      "What's the difference between brand equity and brand value?",
      "How would you approach launching a new product in an existing category?",
      "What consumer trend do you think will most impact FMCG in the next 5 years?",
    ],
  },
  energy: {
    name: "Energy",
    overview: "The energy sector is undergoing its most significant transformation since electrification. Traditional oil and gas majors are pivoting to renewables while new entrants drive offshore wind, solar, hydrogen, and battery storage at scale.",
    trends: [
      "Offshore wind capacity expansion (UK leading globally)", "Green hydrogen production scale-up",
      "Energy storage and battery technology", "Carbon markets and ETS pricing", "Nuclear renaissance (SMRs)",
      "AI optimisation of energy grids", "Oil majors decarbonisation strategy tension"
    ],
    clientSegments: [
      "National governments and regulators", "Industrial and manufacturing customers",
      "Utilities and grid operators", "Institutional investors in energy assets",
      "Retail energy consumers"
    ],
    graduateRoles: ["Graduate Engineer", "Energy Analyst", "Commercial Analyst", "Project Development Analyst", "ESG & Sustainability Analyst", "Trading Analyst"],
    technicalAreas: [
      "Energy markets and price mechanics", "Project finance fundamentals", "Grid infrastructure and balancing",
      "Carbon accounting and Scope 1/2/3", "Renewable project development lifecycle", "Commodity risk management"
    ],
    certifications: ["IGEM (Institution of Gas Engineers)", "Energy Institute professional membership", "IMechE graduate membership", "CFA (for energy finance roles)", "ETRM software (Energy Trading & Risk Management)", "Python / MATLAB for energy modelling"],
    commercialPrompts: [
      "What are the biggest barriers to the UK achieving its 2030 renewables targets?",
      "How do oil majors justify continued fossil fuel investment while pledging net zero?",
      "What is a carbon credit and how does the UK ETS work?",
      "How does energy transition create and destroy value for different stakeholders?",
    ],
    interviewQuestions: [
      "What excites you most about the energy transition?",
      "How would you evaluate the commercial viability of an offshore wind project?",
      "What is baseload power and why is it a challenge for renewable energy?",
      "How should the UK balance energy security with net zero ambitions?",
    ],
  },
  healthcare: {
    name: "Healthcare & Pharmaceuticals",
    overview: "The healthcare sector spans pharmaceuticals, biotech, medical devices, digital health, and NHS/private providers. Graduates enter roles across clinical development, commercial, finance, and consulting within the sector.",
    trends: [
      "AI-accelerated drug discovery and clinical trials", "NHS digital transformation and virtual wards",
      "Gene therapy and personalised medicine", "Mental health service expansion",
      "GLP-1 weight loss drugs reshaping pharma market", "Biosimilars and patent cliff management",
      "HealthTech and remote patient monitoring"
    ],
    clientSegments: [
      "NHS and private healthcare providers", "Patients and consumers", "Regulatory bodies (MHRA, EMA, FDA)",
      "Insurance payers", "Research institutions and universities"
    ],
    graduateRoles: ["Medical Affairs Analyst", "Clinical Data Analyst", "Regulatory Affairs Graduate", "Finance Analyst", "Commercial Graduate", "Healthcare Consultant"],
    technicalAreas: [
      "Clinical trial phases and regulatory pathway", "Health economics and QALY framework", "Pharmacovigilance basics",
      "NHS commissioning and payment by results", "Drug pricing and market access", "GxP regulatory compliance"
    ],
    certifications: ["ABPI Code of Practice training", "ICH GCP (Good Clinical Practice) certification", "TOPRA regulatory affairs training", "Health Economics fundamentals (HEOR)", "PRINCE2 / Agile (for project roles)", "Data analysis (Python, R, SAS)"],
    commercialPrompts: [
      "How does a drug reach market from discovery to approval?",
      "What impact is GLP-1 therapy (Ozempic) having on the wider pharma market?",
      "How does NICE decide whether to recommend a drug on the NHS?",
      "What are the challenges of pricing pharmaceuticals fairly?",
    ],
    interviewQuestions: [
      "Explain the phases of a clinical trial.",
      "How does the NHS decide which treatments to fund?",
      "What is the biggest commercial challenge facing a drug launching in a crowded market?",
      "Tell me about a healthcare innovation that excites you and why.",
    ],
  },
  publicsector: {
    name: "Public Sector & Government",
    overview: "The public sector encompasses civil service, local government, public bodies, and government-adjacent organisations. Graduate schemes in the Civil Service Fast Stream, NHS, and arms-length bodies develop future policy makers and leaders.",
    trends: [
      "AI in public service delivery and fraud detection", "Civil Service Reform and headcount reduction",
      "NHS IMPACT productivity programme", "Devolution and regional inequality policy",
      "Net zero and public sector decarbonisation", "Digital government (GDS, GOV.UK)", "Fiscal consolidation and spending constraints"
    ],
    clientSegments: [
      "Citizens and communities", "Government departments", "Local authorities",
      "NHS trusts and ICSs", "Arms-length bodies and regulators"
    ],
    graduateRoles: ["Fast Stream Policy Advisor", "NHS Graduate Manager", "Local Government Trainee", "Data Analyst (GDS)", "Project Delivery Analyst", "Finance Trainee"],
    technicalAreas: [
      "Policy development and analysis", "Business case writing (Green Book)", "Public finance and budget process",
      "Stakeholder management across government", "Data and evidence-based policy", "Programme delivery (PRINCE2, AgilePM)"
    ],
    certifications: ["Civil Service Learning qualifications", "PRINCE2 / AgilePM", "APM Project Fundamentals", "Government Finance Profession (GFP) qualifications", "Data Science for Government (ONS training)", "Institute for Government programmes"],
    commercialPrompts: [
      "How should the government balance fiscal responsibility with public service investment?",
      "What does effective policy implementation look like?",
      "How is AI being used to improve public service delivery?",
      "What are the key differences between managing in the public vs private sector?",
    ],
    interviewQuestions: [
      "Tell me about a policy you think could be improved and how you'd approach it.",
      "How do you make decisions when you have incomplete or conflicting evidence?",
      "What does good stakeholder management look like in a government context?",
      "How would you handle disagreement with a senior colleague on a policy position?",
    ],
  },
  engineering: {
    name: "Engineering",
    overview: "Engineering spans civil, mechanical, electrical, aerospace, chemical, and software disciplines. Large employers include Rolls-Royce, BAE Systems, Atkins, Arup, and National Grid. Graduate engineers work on major infrastructure, defence, and industrial projects.",
    trends: [
      "Net zero engineering challenges (hydrogen, nuclear, offshore wind)", "AI and digital twins in project design",
      "Defence spending increase post-Ukraine conflict", "HS2 and major UK infrastructure programmes",
      "Electric vehicle and battery supply chain", "Space sector growth", "Advanced manufacturing and Industry 4.0"
    ],
    clientSegments: [
      "Government and public bodies (Network Rail, Highways England)", "Defence clients (MoD)",
      "Energy companies", "Manufacturing and automotive OEMs", "Construction developers"
    ],
    graduateRoles: ["Graduate Engineer", "Systems Engineer", "Project Engineer", "Design Engineer", "Structural Analyst", "Manufacturing Graduate"],
    technicalAreas: [
      "Engineering project lifecycle", "CAD / BIM (Building Information Modelling)", "Systems engineering (SE) methodology",
      "Finite element analysis (FEA) basics", "Health, safety and CDM regulations", "Cost and schedule estimation"
    ],
    certifications: ["IMechE Graduate Membership (AMIMechE)", "IET (Institution of Engineering and Technology)", "ICE Graduate Membership (Civil)", "PRINCE2 (project delivery)", "BIM Level 2 certification", "Chartered Engineer (CEng) pathway"],
    commercialPrompts: [
      "What are the biggest engineering challenges in delivering the UK's net zero commitments?",
      "How is digital twin technology changing how engineers design infrastructure?",
      "Why has the UK defence budget increased and what does this mean for BAE Systems / Rolls-Royce?",
      "What does the engineering skills shortage mean for the profession?",
    ],
    interviewQuestions: [
      "Tell me about a technical project you've worked on and what challenged you.",
      "How do you approach solving a problem where you don't have all the information?",
      "What does sustainability mean in the context of engineering?",
      "Where do you see your engineering career in 10 years?",
    ],
  },
}
