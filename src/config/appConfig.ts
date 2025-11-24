/**
 * Application Configuration
 * 
 * Centralized configuration file for all constants used throughout the application.
 * Modify values here to change behavior across the entire app.
 */

export const appConfig = {
  // Blurt Task Configuration
  blurtTask: {
    // Mastery threshold for selecting lectures for blurt tasks
    // Only lectures with mastery below this threshold will be selected
    masteryThreshold: 30,
  },

  // Question Generation Configuration
  questionGeneration: {
    // Target number of questions to generate per task
    targetQuestions: 10,

    // Days to exam thresholds for weight calculation
    daysToExam: {
      // When exam is 7+ days away, prioritize mastery-based selection
      longTermThreshold: 7,
      // When exam is 3-6 days away, balance mastery and uniform distribution
      shortTermThreshold: 3,
    },

    // Weight distribution based on days to exam
    weights: {
      // 7+ days to exam: heavily prioritize low mastery lectures
      longTerm: {
        masteryWeight: 0.9,
        uniformWeight: 0.1,
      },
      // 3-6 days to exam: balance between mastery and uniform
      mediumTerm: {
        masteryWeight: 0.5,
        uniformWeight: 0.5,
      },
      // <3 days to exam: prioritize uniform distribution (review everything)
      shortTerm: {
        masteryWeight: 0.1,
        uniformWeight: 0.9,
      },
    },

    // Mastery thresholds for difficulty selection
    masteryThresholds: {
      // Below this mastery (0-30%), focus on basic questions
      lowMastery: 0.3,
      // Between 30-70%, mix of difficulties
      mediumMastery: 0.7,
    },

    // Difficulty distribution based on mastery level
    difficultyDistribution: {
      // For low mastery (< 30%)
      lowMastery: {
        basic: 0.7,      // 70% basic
        standard: 0.3,   // 30% standard
        advanced: 0.0,   // 0% advanced
      },
      // For medium mastery (30-70%)
      mediumMastery: {
        basic: 0.3,      // 30% basic
        standard: 0.6,   // 60% standard
        advanced: 0.1,   // 10% advanced
      },
      // For high mastery (>= 70%)
      highMastery: {
        basic: 0.1,      // 10% basic
        standard: 0.5,   // 50% standard
        advanced: 0.4,   // 40% advanced
      },
    },
  },

  // Diagnostic Question Generation Configuration
  diagnostic: {
    // Number of questions to generate per lecture
    questionsPerLecture: {
      min: 2,
      max: 4,
    },

    // Question type distribution (as percentages)
    questionTypeDistribution: {
      multipleChoice: {
        min: 60,
        max: 70,
      },
      shortAnswer: {
        min: 20,
        max: 30,
      },
      trueFalse: 10,
    },

    // Difficulty distribution (as percentages)
    difficultyDistribution: {
      easy: 30,
      medium: 50,
      hard: 20,
    },

    // OpenAI API settings
    openai: {
      temperature: 0.7,
    },
  },

  // Mastery Display Configuration
  masteryDisplay: {
    // Thresholds for color coding mastery levels
    thresholds: {
      // >= 70%: Green (high mastery)
      high: 70,
      // >= 40%: Yellow (medium mastery)
      medium: 40,
      // < 40%: Red (low mastery)
    },
  },

  // Course Content Configuration
  courseContent: {
    // Default mastery threshold for filtering content
    defaultMasteryThreshold: 30,
  },
} as const

// Type export for TypeScript support
export type AppConfig = typeof appConfig

