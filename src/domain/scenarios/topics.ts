/**
 * topics.ts — Domain Scenario & Topic Library
 *
 * Rich topic catalog structured by interest context with:
 * - "Understand the idea" bite-sized learning
 * - Guided practice scenario parameters & initial dialog
 * - Partner persona specifications
 * - Two-Way Bridge templates & DBT pocket scripts
 */

export type InterestCategory =
  | 'work-school'
  | 'friendships'
  | 'everyday'
  | 'boundaries'
  | 'meeting-people'
  | 'appointments'
  | 'custom';

export interface CustomScenarioMetadata {
  userProvidedSituation: string;
  relationshipContext?: string;
  avoidConstraints?: string;
  inferredPartnerConcerns?: string;
  inferredConversationalStyle?: string;
  sourceType: 'manual' | 'document';
  uploadedFileName?: string;
  createdTimestamp: number;
}

export type TopicProgressStatus = 'not-started' | 'in-progress' | 'explored' | 'practiced' | 'revisited';

export interface LearningIdea {
  coreInsight: string;
  doubleEmpathyPerspective: {
    yourNeed: string;
    theirPerspective: string;
  };
  practicalApproaches: string[];
  examplePhrases: {
    gentle: string;
    direct: string;
  };
}

export interface PracticePartner {
  name: string;
  role: string;
  avatarVariant: 'eva';
  defaultTone: string;
  initialDialogue: string;
}

export interface ScenarioDefinition {
  id: string;
  category: InterestCategory;
  categoryLabel: string;
  title: string;
  subtitle: string;
  userGoal: string;
  estimatedMinutes: number;
  status: 'ready' | 'preview';
  accentColor: 'teal' | 'apricot' | 'lavender' | 'sage' | 'amber';
  learning: LearningIdea;
  partner: PracticePartner;
  defaultTakeawayScript: string;
  customMetadata?: CustomScenarioMetadata;
}

export const TOPICS: ScenarioDefinition[] = [
  {
    id: 'work-written-notes',
    category: 'work-school',
    categoryLabel: 'Work or school',
    title: 'Written notes after verbal check-ins',
    subtitle: 'Agreeing on written takeaways without adding extra administrative burden to your manager.',
    userGoal: 'Ensure you have written action items to review without making your manager feel tasked with extra emails.',
    estimatedMinutes: 4,
    status: 'ready',
    accentColor: 'apricot',
    learning: {
      coreInsight:
        'People process spoken instructions differently. Asking for written confirmation protects accuracy, but managers often hear "can you write notes for me?" as another task on their overloaded plate.',
      doubleEmpathyPerspective: {
        yourNeed: 'Clear, readable reference points so details are not lost in verbal memory.',
        theirPerspective: 'Feeling constrained on time and wary of committing to recurring administrative drafting.',
      },
      practicalApproaches: [
        'Offer to absorb the drafting effort: write 3 quick bullets yourself and ask for a quick thumbs-up.',
        'Frame it around team delivery quality: "I want to be certain I deliver exactly what you envision."',
        'Keep the ask frictionless: specify that a 10-second emoji reaction or one-word reply is all that is needed.',
      ],
      examplePhrases: {
        gentle: 'Would it be helpful if I send a quick 2-line bullet recap so you can give it a quick check?',
        direct: 'To make sure nothing gets dropped, I will send you my notes right after this for a fast confirmation.',
      },
    },
    partner: {
      name: 'Eva',
      role: 'Project Lead',
      avatarVariant: 'eva',
      defaultTone: 'Direct, fast-paced, balancing several deadlines',
      initialDialogue:
        "Hey, thanks for jumping on. Like we just talked through, I need you to push that update before end of day. Any questions before we wrap up?",
    },
    defaultTakeawayScript:
      'I will post a quick 2-bullet summary in our channel right now. A quick thumbs-up is all I need so we are both confident on the deliverables.',
  },
  {
    id: 'friendship-quiet-place',
    category: 'friendships',
    categoryLabel: 'Friendships',
    title: 'Suggesting a calmer spot to meet',
    subtitle: 'Proposing an alternative place without making your friend feel rejected or accommodating.',
    userGoal: 'Suggest a quieter place where you can comfortably talk and hear each other, while keeping enthusiasm for getting together.',
    estimatedMinutes: 3,
    status: 'ready',
    accentColor: 'lavender',
    learning: {
      coreInsight:
        'Auditory overwhelm drains social energy fast. Proposing a quieter spot works best when your friend understands that you want to be able to focus on them.',
      doubleEmpathyPerspective: {
        yourNeed: 'An environment with manageable acoustics where conversation does not require straining.',
        theirPerspective: 'Excitement about trying a popular or lively venue, possibly interpreting refusal as lukewarm interest in meeting up.',
      },
      practicalApproaches: [
        'Anchor on your desire to connect: "I really want to hear all about your week without yelling over music."',
        'Suggest an equally pleasant alternative right away so they do not feel put on the spot to re-plan.',
        'Frame it as a sensory preference rather than a critique of their choice.',
      ],
      examplePhrases: {
        gentle: 'I would love to catch up! That cafe gets a bit loud for me—what if we tried the garden patio down the block?',
        direct: 'I am really excited to see you. Loud rooms tire my ears out quickly, so could we pick somewhere with a quieter seating area?',
      },
    },
    partner: {
      name: 'Eva',
      role: 'Close Friend',
      avatarVariant: 'eva',
      defaultTone: 'Warm, enthusiastic, loves lively social outings',
      initialDialogue:
        "I'm so excited for Friday! I was thinking we could check out that new rooftop lounge downtown—it gets super packed with music, which sounded like so much fun!",
    },
    defaultTakeawayScript:
      'I really want to catch up and actually hear you without shouting over music. Could we go to the cafe patio next door instead?',
  },
  {
    id: 'boundary-saying-no',
    category: 'boundaries',
    categoryLabel: 'Setting boundaries',
    title: 'Declining an extra commitment',
    subtitle: 'Saying no clearly and warmly without over-explaining or inviting negotiations.',
    userGoal: 'Decline an invitation or request with warmth and finality, without apologizing excessively or giving reasons that can be solved.',
    estimatedMinutes: 3,
    status: 'ready',
    accentColor: 'sage',
    learning: {
      coreInsight:
        'When we provide long lists of reasons for saying no, other people naturally try to "help" by solving those reasons. A clean, kind refusal protects both your boundaries and the relationship.',
      doubleEmpathyPerspective: {
        yourNeed: 'Protecting your capacity and energy without carrying lingering guilt.',
        theirPerspective: 'Looking for a reliable helper to fill a gap, hoping anyone with potential availability might say yes.',
      },
      practicalApproaches: [
        'Thank them for thinking of you before delivering the refusal.',
        'State your inability to take it on without leaving tentative wiggle room ("I might be able to..." weakens clarity).',
        'Wish them success with finding someone else.',
      ],
      examplePhrases: {
        gentle: 'Thank you for thinking of me! My plate is full this weekend, so I won’t be able to join, but I hope the event goes wonderfully.',
        direct: 'I cannot take that on right now, but thank you for asking me.',
      },
    },
    partner: {
      name: 'Eva',
      role: 'Community Organizer',
      avatarVariant: 'eva',
      defaultTone: 'Optimistic, eager to find volunteers, persuasive',
      initialDialogue:
        "Hey! We're putting together the weekend volunteer shift and we really need one more person to lead the registration desk. Could you take Saturday morning?",
    },
    defaultTakeawayScript:
      'Thank you for thinking of me! I won’t be able to take that on this Saturday, but I hope the morning goes smoothly.',
  },
  {
    id: 'everyday-smalltalk',
    category: 'everyday',
    categoryLabel: 'Everyday conversations',
    title: 'Following up on a mutual interest',
    subtitle: 'Starting a pleasant exchange with someone you see regularly without feeling forced.',
    userGoal: 'Exchange a comfortable, brief conversation that feels natural to open and easy to close.',
    estimatedMinutes: 3,
    status: 'ready',
    accentColor: 'amber',
    learning: {
      coreInsight:
        'Small talk is not meant to be deeply profound; it serves as a gentle social handshake to acknowledge each other’s presence and warmth.',
      doubleEmpathyPerspective: {
        yourNeed: 'Predictable pacing and low pressure to perform or maintain endless banter.',
        theirPerspective: 'Sharing friendly casual energy and establishing rapport.',
      },
      practicalApproaches: [
        'Notice an observable detail or shared experience (weather, project, shared coffee machine).',
        'Keep your opener open-ended: "How did that presentation turn out?" rather than just "Good morning."',
        'Have a graceful exit phrase ready: "Good luck with that today, catch you later!"',
      ],
      examplePhrases: {
        gentle: 'Morning! How is your week shaping up with that new project launch?',
        direct: 'Hey Eva, good to see you. Did you get a chance to finish that report yesterday?',
      },
    },
    partner: {
      name: 'Eva',
      role: 'Teammate / Neighbor',
      avatarVariant: 'eva',
      defaultTone: 'Casual, friendly, approachable',
      initialDialogue:
        "Morning! How's your week going so far? Seems like everyone is rushing around today.",
    },
    defaultTakeawayScript:
      'Things are going well, thanks! How did your project kickoff wrap up yesterday?',
  },
  {
    id: 'meeting-group-discussion',
    category: 'meeting-people',
    categoryLabel: 'Meeting new people',
    title: 'Joining a group discussion',
    subtitle: 'Stepping into an existing group conversation at a meetup or gathering.',
    userGoal: 'Find a natural pause to introduce yourself and listen in without feeling like an intruder.',
    estimatedMinutes: 5,
    status: 'preview',
    accentColor: 'lavender',
    learning: {
      coreInsight:
        'In open social groups, joining is expected. Pausing to listen for 30 seconds before contributing helps you catch the rhythm of the discussion.',
      doubleEmpathyPerspective: {
        yourNeed: 'A clear entry signal without feeling awkward or disruptive.',
        theirPerspective: 'Open to new voices as long as the current topic is acknowledged.',
      },
      practicalApproaches: [
        'Step within the circle perimeter and offer an open, friendly nod.',
        'Use the topic at hand as your bridge: "Mind if I listen in? I was just reading about that."',
      ],
      examplePhrases: {
        gentle: 'Mind if I join you all? That topic sounds really interesting.',
        direct: 'Hi everyone, I overheard you talking about the design system—mind if I listen in?',
      },
    },
    partner: {
      name: 'Eva',
      role: 'Meetup Participant',
      avatarVariant: 'eva',
      defaultTone: 'Engaged, conversing in a small circle',
      initialDialogue:
        "...and that's when we realized the whole schedule had to shift! Oh, hi there! Were you looking to join the discussion?",
    },
    defaultTakeawayScript:
      'Hi, I’m new to the meetup and caught your topic—mind if I join and listen in?',
  },
  {
    id: 'appointments-clarification',
    category: 'appointments',
    categoryLabel: 'Appointments',
    title: 'Pausing fast instructions to take notes',
    subtitle: 'Asking a doctor or service specialist to slow down so you can note key details.',
    userGoal: 'Comfortably pause someone speaking quickly and ask them to repeat the next steps.',
    estimatedMinutes: 4,
    status: 'preview',
    accentColor: 'apricot',
    learning: {
      coreInsight:
        'Providers often relay information in rapid bursts because it is routine to them. Requesting a pause signals diligence, not deficiency.',
      doubleEmpathyPerspective: {
        yourNeed: 'Time to process and write down sequential medical or technical instructions.',
        theirPerspective: 'Navigating tight appointment schedules and assuming silence means comprehension.',
      },
      practicalApproaches: [
        'Directly hold up your pen or phone: "I want to be sure I follow this correctly—could you repeat the last step?"',
        'Recap what you heard so far to anchor the discussion.',
      ],
      examplePhrases: {
        gentle: 'Could we pause for just a moment? I want to write those two instructions down accurately.',
        direct: 'Before we move on, could you repeat what medicine I should take in the morning so I have it noted?',
      },
    },
    partner: {
      name: 'Eva',
      role: 'Specialist',
      avatarVariant: 'eva',
      defaultTone: 'Professional, brisk, highly informational',
      initialDialogue:
        "Alright, so you'll take this dosage twice daily with meals, schedule the follow-up panel in 3 weeks, and check in if you notice any changes. Sound good?",
    },
    defaultTakeawayScript:
      'Could we pause for 10 seconds? I want to write those exact three steps in my notes before we wrap up.',
  },
];

const customScenarioRegistry = new Map<string, ScenarioDefinition>();

export function registerCustomTopic(topic: ScenarioDefinition): void {
  customScenarioRegistry.set(topic.id, topic);
}

export function getRegisteredCustomTopics(): ScenarioDefinition[] {
  return Array.from(customScenarioRegistry.values());
}

export function getTopicById(id: string): ScenarioDefinition | undefined {
  return customScenarioRegistry.get(id) || TOPICS.find((t) => t.id === id);
}

export function getTopicsByCategory(category: InterestCategory): ScenarioDefinition[] {
  if (category === 'custom') {
    return Array.from(customScenarioRegistry.values());
  }
  return TOPICS.filter((t) => t.category === category);
}
