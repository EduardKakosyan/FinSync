// Halifax-specific financial services and calculations for Nova Scotia residents
import { Transaction } from '@/types';

export interface HSTCalculation {
  subtotal: number;
  hstAmount: number;
  total: number;
  hstRate: number;
}

export interface LocalBankInfo {
  id: string;
  name: string;
  type: 'credit_union' | 'major_bank' | 'local_bank';
  location: string;
  services: string[];
  contact: {
    phone: string;
    website: string;
    address: string;
  };
}

export interface LocalTaxInfo {
  provincialTaxRate: number;
  federalTaxRate: number;
  combinedRate: number;
  rrspLimit: number;
  tfsaLimit: number;
  homeEducationSavingsAccount: boolean;
}

export interface LocalEconomicData {
  unemploymentRate: number;
  averageIncome: number;
  housingPrice: {
    average: number;
    trend: 'up' | 'down' | 'stable';
  };
  costOfLiving: {
    index: number;
    comparedToCanada: number;
  };
}

class HalifaxLocalService {
  private static instance: HalifaxLocalService;
  
  // Current NS HST rate
  private readonly HST_RATE = 0.14; // 14% HST in Nova Scotia
  
  // Nova Scotia provincial tax brackets (2024)
  private readonly NS_TAX_BRACKETS = [
    { min: 0, max: 29590, rate: 0.0879 },
    { min: 29590, max: 59180, rate: 0.1495 },
    { min: 59180, max: 93000, rate: 0.1667 },
    { min: 93000, max: 150000, rate: 0.175 },
    { min: 150000, max: Infinity, rate: 0.21 },
  ];

  private constructor() {}

  public static getInstance(): HalifaxLocalService {
    if (!HalifaxLocalService.instance) {
      HalifaxLocalService.instance = new HalifaxLocalService();
    }
    return HalifaxLocalService.instance;
  }

  /**
   * Calculate HST for Nova Scotia purchases
   */
  calculateHST(amount: number, includesHST: boolean = false): HSTCalculation {
    if (includesHST) {
      // Amount includes HST, calculate backwards
      const subtotal = amount / (1 + this.HST_RATE);
      const hstAmount = amount - subtotal;
      
      return {
        subtotal: Number(subtotal.toFixed(2)),
        hstAmount: Number(hstAmount.toFixed(2)),
        total: amount,
        hstRate: this.HST_RATE,
      };
    } else {
      // Amount is pre-tax
      const hstAmount = amount * this.HST_RATE;
      const total = amount + hstAmount;
      
      return {
        subtotal: amount,
        hstAmount: Number(hstAmount.toFixed(2)),
        total: Number(total.toFixed(2)),
        hstRate: this.HST_RATE,
      };
    }
  }

  /**
   * Get local Halifax/Nova Scotia banks and credit unions
   */
  getLocalBanks(): LocalBankInfo[] {
    return [
      {
        id: 'nscu',
        name: 'Nova Scotia Credit Union',
        type: 'credit_union',
        location: 'Halifax',
        services: ['Personal Banking', 'Business Banking', 'Mortgages', 'Investments'],
        contact: {
          phone: '(902) 455-5555',
          website: 'https://nscu.ca',
          address: '1649 Bedford Row, Halifax, NS',
        },
      },
      {
        id: 'eastlink_cu',
        name: 'Eastlink Credit Union',
        type: 'credit_union',
        location: 'Halifax',
        services: ['Personal Banking', 'Student Services', 'Auto Loans', 'RRSPs'],
        contact: {
          phone: '(902) 453-4700',
          website: 'https://eastlinkcu.com',
          address: '1668 Barrington St, Halifax, NS',
        },
      },
      {
        id: 'rbc_halifax',
        name: 'RBC Royal Bank - Halifax',
        type: 'major_bank',
        location: 'Halifax',
        services: ['Full Service Banking', 'Investment Services', 'Business Banking'],
        contact: {
          phone: '(902) 421-8100',
          website: 'https://rbc.com',
          address: '1809 Barrington St, Halifax, NS',
        },
      },
      {
        id: 'td_halifax',
        name: 'TD Canada Trust - Halifax',
        type: 'major_bank',
        location: 'Halifax',
        services: ['Personal Banking', 'Small Business', 'Mortgages', 'Investments'],
        contact: {
          phone: '(902) 420-3193',
          website: 'https://td.com',
          address: '1791 Barrington St, Halifax, NS',
        },
      },
      {
        id: 'bmo_halifax',
        name: 'BMO Bank of Montreal - Halifax',
        type: 'major_bank',
        location: 'Halifax',
        services: ['Personal Banking', 'Business Solutions', 'Wealth Management'],
        contact: {
          phone: '(902) 420-2034',
          website: 'https://bmo.com',
          address: '1595 Bedford Row, Halifax, NS',
        },
      },
      {
        id: 'provincial_cu',
        name: 'Provincial Credit Union',
        type: 'credit_union',
        location: 'Nova Scotia',
        services: ['Community Banking', 'Agricultural Loans', 'Personal Banking'],
        contact: {
          phone: '(902) 893-8881',
          website: 'https://provincialcu.ca',
          address: 'Multiple Locations',
        },
      },
    ];
  }

  /**
   * Get Nova Scotia tax information
   */
  getLocalTaxInfo(): LocalTaxInfo {
    return {
      provincialTaxRate: 0.1495, // Average NS rate
      federalTaxRate: 0.15, // Federal basic rate
      combinedRate: 0.2995, // Combined average
      rrspLimit: 31560, // 2024 RRSP contribution limit
      tfsaLimit: 7000, // 2024 TFSA contribution limit
      homeEducationSavingsAccount: true, // NS supports RESP programs
    };
  }

  /**
   * Calculate Nova Scotia provincial tax estimate
   */
  calculateProvincialTax(annualIncome: number): {
    provincialTax: number;
    marginalRate: number;
    bracket: string;
  } {
    let tax = 0;
    let marginalRate = 0;
    let bracket = '';

    for (const taxBracket of this.NS_TAX_BRACKETS) {
      if (annualIncome > taxBracket.min) {
        const taxableInThisBracket = Math.min(
          annualIncome - taxBracket.min,
          taxBracket.max - taxBracket.min
        );
        tax += taxableInThisBracket * taxBracket.rate;
        marginalRate = taxBracket.rate;
        bracket = `${taxBracket.rate * 100}%`;
      }
    }

    return {
      provincialTax: Number(tax.toFixed(2)),
      marginalRate,
      bracket,
    };
  }

  /**
   * Get local economic data for Halifax
   */
  getLocalEconomicData(): LocalEconomicData {
    return {
      unemploymentRate: 6.2, // As of 2024
      averageIncome: 42000, // Halifax average household income
      housingPrice: {
        average: 425000, // Average home price in Halifax
        trend: 'stable',
      },
      costOfLiving: {
        index: 85, // Relative to 100 (national average)
        comparedToCanada: -15, // 15% below national average
      },
    };
  }

  /**
   * Categorize transactions with local context
   */
  categorizeWithLocalContext(transactions: Transaction[]): {
    [category: string]: {
      transactions: Transaction[];
      total: number;
      localContext: string;
    };
  } {
    const categories: any = {};

    // Group transactions by category
    transactions.forEach(transaction => {
      if (!categories[transaction.category]) {
        categories[transaction.category] = {
          transactions: [],
          total: 0,
          localContext: '',
        };
      }
      categories[transaction.category].transactions.push(transaction);
      categories[transaction.category].total += transaction.amount;
    });

    // Add local context to each category
    Object.keys(categories).forEach(category => {
      categories[category].localContext = this.getLocalContextForCategory(category);
    });

    return categories;
  }

  /**
   * Get Halifax-specific insights for spending categories
   */
  private getLocalContextForCategory(category: string): string {
    const contexts: { [key: string]: string } = {
      'Food & Dining': 'Halifax has diverse dining options. Consider supporting local restaurants in the downtown core.',
      'Transportation': 'Halifax Transit offers monthly passes. Consider cycling - Halifax has growing bike infrastructure.',
      'Housing': 'Halifax housing market is more affordable than Toronto/Vancouver but prices are rising.',
      'Utilities': 'Nova Scotia Power rates are regulated. Consider energy efficiency programs.',
      'Healthcare': 'Most healthcare is covered by MSI. Dental and vision may need private insurance.',
      'Entertainment': 'Halifax offers many free cultural events, especially during summer festivals.',
      'Shopping': 'Halifax Shopping Centre and downtown boutiques. Consider supporting local businesses.',
      'Education': 'Home to multiple universities. Education tax credits available in NS.',
      'Insurance': 'Car insurance rates vary significantly. Shop around annually.',
      'Banking': 'Consider local credit unions for better rates and community focus.',
    };

    return contexts[category] || 'Track this category to understand your spending patterns better.';
  }

  /**
   * Get recommendations based on Halifax living
   */
  getLocalRecommendations(): {
    banking: string[];
    housing: string[];
    transportation: string[];
    savings: string[];
    lifestyle: string[];
  } {
    return {
      banking: [
        'Consider Nova Scotia Credit Union for better rates',
        'Look into community banking options',
        'Use local ATMs to avoid fees',
        'Explore credit union investment options',
      ],
      housing: [
        'Research first-time homebuyer programs in NS',
        'Consider suburbs like Bedford or Dartmouth for value',
        'Factor in property taxes when budgeting',
        'Look into energy efficiency rebates',
      ],
      transportation: [
        'Halifax Transit monthly pass: $82.50',
        'Consider car-sharing services downtown',
        'Factor in winter tire costs',
        'Explore cycling for spring/summer commuting',
      ],
      savings: [
        'Maximize TFSA contributions first',
        'Consider RRSP for tax deferral',
        'Look into NS pension plan if eligible',
        'Research local investment advisors',
      ],
      lifestyle: [
        'Take advantage of free outdoor activities',
        'Support local farmers markets',
        'Consider seasonal employment if applicable',
        'Explore Halifax library programs and services',
      ],
    };
  }

  /**
   * Calculate cost of living comparison
   */
  calculateCostOfLivingComparison(currentExpenses: number): {
    halifaxCost: number;
    torontoCost: number;
    vancouverCost: number;
    savings: number;
  } {
    // Cost multipliers compared to Halifax
    const multipliers = {
      halifax: 1.0,
      toronto: 1.4,
      vancouver: 1.5,
    };

    const halifaxCost = currentExpenses;
    const torontoCost = currentExpenses * multipliers.toronto;
    const vancouverCost = currentExpenses * multipliers.vancouver;

    return {
      halifaxCost,
      torontoCost,
      vancouverCost,
      savings: Math.max(0, torontoCost - halifaxCost),
    };
  }

  /**
   * Get seasonal financial tips for Halifax
   */
  getSeasonalTips(): {
    season: string;
    tips: string[];
  } {
    const month = new Date().getMonth();
    
    if (month >= 2 && month <= 4) { // Spring
      return {
        season: 'Spring',
        tips: [
          'Start planning for summer activities and budget accordingly',
          'Consider home maintenance projects with milder weather',
          'Tax season - gather documents and file early',
          'Review and adjust your budget after winter heating costs',
        ],
      };
    } else if (month >= 5 && month <= 7) { // Summer
      return {
        season: 'Summer',
        tips: [
          'Take advantage of free outdoor festivals and events',
          'Plan for summer vacation expenses',
          'Consider farmers markets for fresh, local produce',
          'Enjoy lower heating costs',
        ],
      };
    } else if (month >= 8 && month <= 10) { // Fall
      return {
        season: 'Fall',
        tips: [
          'Start budgeting for winter heating costs',
          'Back-to-school expenses if applicable',
          'Consider winter tire installation costs',
          'Plan for holiday spending season',
        ],
      };
    } else { // Winter
      return {
        season: 'Winter',
        tips: [
          'Monitor heating costs closely',
          'Budget for snow removal if homeowner',
          'Consider winter activity costs (skiing, etc.)',
          'Plan for holiday expenses',
        ],
      };
    }
  }

  /**
   * Get local emergency fund recommendations
   */
  getEmergencyFundRecommendations(): {
    targetAmount: number;
    reasoning: string;
    localFactors: string[];
  } {
    const economicData = this.getLocalEconomicData();
    const targetAmount = economicData.averageIncome * 0.5; // 6 months of average expenses

    return {
      targetAmount,
      reasoning: 'Halifax-specific emergency fund should cover 6 months of expenses, considering seasonal employment variations and potential economic volatility in the maritime economy.',
      localFactors: [
        'Maritime economy can be seasonal',
        'Winter weather may increase emergency expenses',
        'Healthcare covered but dental/vision costs can be significant',
        'Home heating costs vary significantly by season',
        'Transportation costs may increase in winter',
      ],
    };
  }
}

export const halifaxLocalService = HalifaxLocalService.getInstance();
export default halifaxLocalService;