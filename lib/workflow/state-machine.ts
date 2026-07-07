/**
 * Workflow State Machine
 * Implements a robust state machine for government workflow processes
 */

export enum WorkflowType {
  COMPLAINT = 'COMPLAINT',
  INVESTIGATION = 'INVESTIGATION',
  OPERATION = 'OPERATION',
  EVIDENCE = 'EVIDENCE',
  PRISONER = 'PRISONER',
  WANTED_PERSON = 'WANTED_PERSON'
}

export enum ComplaintWorkflowState {
  SUBMITTED = 'SUBMITTED',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  INVESTIGATING = 'INVESTIGATING',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum InvestigationWorkflowState {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  EVIDENCE_ANALYSIS = 'EVIDENCE_ANALYSIS',
  AWAITING_LAB = 'AWAITING_LAB',
  LAB_ANALYSIS = 'LAB_ANALYSIS',
  PROSECUTOR_REVIEW = 'PROSECUTOR_REVIEW',
  COURT_REFERRAL = 'COURT_REFERRAL',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

export enum OperationWorkflowState {
  PLANNED = 'PLANNED',
  BRIEFING = 'BRIEFING',
  EXECUTION = 'EXECUTION',
  DEBRIEF = 'DEBRIEF',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum EvidenceWorkflowState {
  COLLECTED = 'COLLECTED',
  LOGGED = 'LOGGED',
  STORED = 'STORED',
  ANALYSIS_REQUESTED = 'ANALYSIS_REQUESTED',
  IN_ANALYSIS = 'IN_ANALYSIS',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  ARCHIVED = 'ARCHIVED'
}

// Union type of all states
export type WorkflowState = 
  | ComplaintWorkflowState 
  | InvestigationWorkflowState 
  | OperationWorkflowState 
  | EvidenceWorkflowState

/**
 * Workflow Transition Definition
 */
export interface WorkflowTransitionDef {
  fromState: WorkflowState
  toState: WorkflowState
  requiresApproval: boolean
  approvalRole?: string  // e.g., 'INVESTIGATOR', 'PROSECUTOR'
  condition?: (context: TransitionContext) => boolean
  description: string
  sla?: number  // SLA in hours
}

/**
 * Context provided to transition condition and handlers
 */
export interface TransitionContext {
  workflowType: WorkflowType
  entityId: string
  userId: string
  userRole: string
  userDepartment: string
  metadata: Record<string, any>
  currentState: WorkflowState
  targetState: WorkflowState
  timestamp: Date
}

/**
 * Transition Result
 */
export interface TransitionResult {
  success: boolean
  previousState: WorkflowState
  newState: WorkflowState
  timestamp: Date
  transitionId: string
  approvalRequired: boolean
  approvalRole?: string
  message: string
}

/**
 * Workflow State Machine
 */
export class WorkflowStateMachine {
  private transitions: Map<WorkflowType, WorkflowTransitionDef[]> = new Map()

  constructor() {
    this.initializeTransitions()
  }

  /**
   * Initialize all workflow transitions
   */
  private initializeTransitions(): void {
    // Complaint Workflow Transitions
    this.registerTransitions(WorkflowType.COMPLAINT, [
      {
        fromState: ComplaintWorkflowState.SUBMITTED,
        toState: ComplaintWorkflowState.REVIEWED,
        requiresApproval: false,
        description: 'Initial review of complaint',
        sla: 24
      },
      {
        fromState: ComplaintWorkflowState.REVIEWED,
        toState: ComplaintWorkflowState.APPROVED,
        requiresApproval: true,
        approvalRole: 'SUPERVISOR',
        description: 'Complaint approved for investigation',
        sla: 48
      },
      {
        fromState: ComplaintWorkflowState.REVIEWED,
        toState: ComplaintWorkflowState.REJECTED,
        requiresApproval: true,
        approvalRole: 'SUPERVISOR',
        description: 'Complaint rejected',
        sla: 48
      },
      {
        fromState: ComplaintWorkflowState.APPROVED,
        toState: ComplaintWorkflowState.INVESTIGATING,
        requiresApproval: false,
        description: 'Investigation started',
        sla: 72
      },
      {
        fromState: ComplaintWorkflowState.INVESTIGATING,
        toState: ComplaintWorkflowState.COMPLETED,
        requiresApproval: true,
        approvalRole: 'CHIEF_INVESTIGATOR',
        description: 'Investigation completed',
        sla: 30 * 24  // 30 days
      },
      {
        fromState: ComplaintWorkflowState.COMPLETED,
        toState: ComplaintWorkflowState.ARCHIVED,
        requiresApproval: false,
        description: 'Case archived',
        sla: undefined
      }
    ])

    // Investigation Workflow Transitions
    this.registerTransitions(WorkflowType.INVESTIGATION, [
      {
        fromState: InvestigationWorkflowState.ASSIGNED,
        toState: InvestigationWorkflowState.IN_PROGRESS,
        requiresApproval: false,
        description: 'Investigation started',
        sla: 24
      },
      {
        fromState: InvestigationWorkflowState.IN_PROGRESS,
        toState: InvestigationWorkflowState.EVIDENCE_ANALYSIS,
        requiresApproval: false,
        description: 'Evidence analysis phase',
        sla: undefined
      },
      {
        fromState: InvestigationWorkflowState.EVIDENCE_ANALYSIS,
        toState: InvestigationWorkflowState.AWAITING_LAB,
        requiresApproval: false,
        description: 'Waiting for lab analysis',
        sla: 72
      },
      {
        fromState: InvestigationWorkflowState.AWAITING_LAB,
        toState: InvestigationWorkflowState.LAB_ANALYSIS,
        requiresApproval: false,
        description: 'Lab analysis in progress',
        sla: undefined
      },
      {
        fromState: InvestigationWorkflowState.LAB_ANALYSIS,
        toState: InvestigationWorkflowState.PROSECUTOR_REVIEW,
        requiresApproval: false,
        description: 'Results submitted to prosecutor',
        sla: 24
      },
      {
        fromState: InvestigationWorkflowState.PROSECUTOR_REVIEW,
        toState: InvestigationWorkflowState.COURT_REFERRAL,
        requiresApproval: true,
        approvalRole: 'PROSECUTOR',
        description: 'Referred to court',
        sla: 48
      },
      {
        fromState: InvestigationWorkflowState.PROSECUTOR_REVIEW,
        toState: InvestigationWorkflowState.CLOSED,
        requiresApproval: true,
        approvalRole: 'PROSECUTOR',
        description: 'Investigation closed without referral',
        sla: 48
      },
      {
        fromState: InvestigationWorkflowState.COURT_REFERRAL,
        toState: InvestigationWorkflowState.CLOSED,
        requiresApproval: false,
        description: 'Case closed',
        sla: undefined
      },
      {
        fromState: InvestigationWorkflowState.CLOSED,
        toState: InvestigationWorkflowState.ARCHIVED,
        requiresApproval: false,
        description: 'Case archived',
        sla: undefined
      }
    ])

    // Operation Workflow Transitions
    this.registerTransitions(WorkflowType.OPERATION, [
      {
        fromState: OperationWorkflowState.PLANNED,
        toState: OperationWorkflowState.BRIEFING,
        requiresApproval: true,
        approvalRole: 'COMMANDER',
        description: 'Operation briefing scheduled',
        sla: 24
      },
      {
        fromState: OperationWorkflowState.BRIEFING,
        toState: OperationWorkflowState.EXECUTION,
        requiresApproval: false,
        description: 'Operation execution started',
        sla: undefined
      },
      {
        fromState: OperationWorkflowState.EXECUTION,
        toState: OperationWorkflowState.DEBRIEF,
        requiresApproval: false,
        description: 'Operation debrief phase',
        sla: 4
      },
      {
        fromState: OperationWorkflowState.DEBRIEF,
        toState: OperationWorkflowState.COMPLETED,
        requiresApproval: true,
        approvalRole: 'COMMANDER',
        description: 'Operation completed',
        sla: 24
      },
      {
        fromState: OperationWorkflowState.COMPLETED,
        toState: OperationWorkflowState.ARCHIVED,
        requiresApproval: false,
        description: 'Operation archived',
        sla: undefined
      }
    ])

    // Evidence Workflow Transitions
    this.registerTransitions(WorkflowType.EVIDENCE, [
      {
        fromState: EvidenceWorkflowState.COLLECTED,
        toState: EvidenceWorkflowState.LOGGED,
        requiresApproval: false,
        description: 'Evidence logged into system',
        sla: 4
      },
      {
        fromState: EvidenceWorkflowState.LOGGED,
        toState: EvidenceWorkflowState.STORED,
        requiresApproval: false,
        description: 'Evidence stored in secure location',
        sla: 24
      },
      {
        fromState: EvidenceWorkflowState.STORED,
        toState: EvidenceWorkflowState.ANALYSIS_REQUESTED,
        requiresApproval: true,
        approvalRole: 'INVESTIGATOR',
        description: 'Analysis request approved',
        sla: 48
      },
      {
        fromState: EvidenceWorkflowState.ANALYSIS_REQUESTED,
        toState: EvidenceWorkflowState.IN_ANALYSIS,
        requiresApproval: false,
        description: 'Analysis in progress',
        sla: undefined
      },
      {
        fromState: EvidenceWorkflowState.IN_ANALYSIS,
        toState: EvidenceWorkflowState.ANALYSIS_COMPLETE,
        requiresApproval: false,
        description: 'Analysis completed',
        sla: undefined
      },
      {
        fromState: EvidenceWorkflowState.ANALYSIS_COMPLETE,
        toState: EvidenceWorkflowState.STORED,
        requiresApproval: false,
        description: 'Evidence returned to storage',
        sla: 24
      },
      {
        fromState: EvidenceWorkflowState.ANALYSIS_COMPLETE,
        toState: EvidenceWorkflowState.ARCHIVED,
        requiresApproval: false,
        description: 'Evidence archived',
        sla: undefined
      }
    ])
  }

  /**
   * Register transitions for a workflow type
   */
  private registerTransitions(
    workflowType: WorkflowType,
    transitions: WorkflowTransitionDef[]
  ): void {
    this.transitions.set(workflowType, transitions)
  }

  /**
   * Check if transition is allowed
   */
  canTransition(
    workflowType: WorkflowType,
    fromState: WorkflowState,
    toState: WorkflowState,
    context?: TransitionContext
  ): boolean {
    const transitions = this.transitions.get(workflowType) || []
    const transition = transitions.find(
      (t) => t.fromState === fromState && t.toState === toState
    )

    if (!transition) return false

    // Check condition if provided
    if (transition.condition && context) {
      return transition.condition(context)
    }

    return true
  }

  /**
   * Get available next states
   */
  getNextStates(
    workflowType: WorkflowType,
    currentState: WorkflowState
  ): WorkflowTransitionDef[] {
    const transitions = this.transitions.get(workflowType) || []
    return transitions.filter((t) => t.fromState === currentState)
  }

  /**
   * Get available previous states
   */
  getPreviousStates(
    workflowType: WorkflowType,
    currentState: WorkflowState
  ): WorkflowTransitionDef[] {
    const transitions = this.transitions.get(workflowType) || []
    return transitions.filter((t) => t.toState === currentState)
  }

  /**
   * Transition to new state
   */
  async transitionTo(
    context: TransitionContext
  ): Promise<TransitionResult> {
    const { workflowType, currentState, targetState } = context

    // Check if transition is allowed
    if (
      !this.canTransition(workflowType, currentState, targetState, context)
    ) {
      return {
        success: false,
        previousState: currentState,
        newState: currentState,
        timestamp: new Date(),
        transitionId: '',
        approvalRequired: false,
        message: `Cannot transition from ${currentState} to ${targetState}`
      }
    }

    // Get transition definition
    const transitions = this.transitions.get(workflowType) || []
    const transition = transitions.find(
      (t) => t.fromState === currentState && t.toState === targetState
    )

    if (!transition) {
      return {
        success: false,
        previousState: currentState,
        newState: currentState,
        timestamp: new Date(),
        transitionId: '',
        approvalRequired: false,
        message: 'Transition not defined'
      }
    }

    // Generate transition ID
    const transitionId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      success: true,
      previousState: currentState,
      newState: targetState,
      timestamp: new Date(),
      transitionId,
      approvalRequired: transition.requiresApproval,
      approvalRole: transition.approvalRole,
      message: transition.description
    }
  }

  /**
   * Get transition details
   */
  getTransitionDetails(
    workflowType: WorkflowType,
    fromState: WorkflowState,
    toState: WorkflowState
  ): WorkflowTransitionDef | undefined {
    const transitions = this.transitions.get(workflowType) || []
    return transitions.find(
      (t) => t.fromState === fromState && t.toState === toState
    )
  }

  /**
   * Validate state for workflow type
   */
  isValidState(workflowType: WorkflowType, state: WorkflowState): boolean {
    const allStates = new Set<WorkflowState>()
    const transitions = this.transitions.get(workflowType) || []

    transitions.forEach((t) => {
      allStates.add(t.fromState)
      allStates.add(t.toState)
    })

    return allStates.has(state)
  }

  /**
   * Get all states for workflow type
   */
  getAllStates(workflowType: WorkflowType): WorkflowState[] {
    const states = new Set<WorkflowState>()
    const transitions = this.transitions.get(workflowType) || []

    transitions.forEach((t) => {
      states.add(t.fromState)
      states.add(t.toState)
    })

    return Array.from(states)
  }

  /**
   * Get workflow path from start to end
   */
  getWorkflowPath(
    workflowType: WorkflowType,
    startState: WorkflowState,
    endState: WorkflowState
  ): WorkflowState[][] {
    const transitions = this.transitions.get(workflowType) || []
    const paths: WorkflowState[][] = []

    const dfs = (current: WorkflowState, target: WorkflowState, path: WorkflowState[]) => {
      if (current === target) {
        paths.push([...path])
        return
      }

      const nextTransitions = transitions.filter((t) => t.fromState === current)
      for (const transition of nextTransitions) {
        if (!path.includes(transition.toState)) {
          path.push(transition.toState)
          dfs(transition.toState, target, path)
          path.pop()
        }
      }
    }

    dfs(startState, endState, [startState])
    return paths
  }
}

// Export singleton instance
export const workflowStateMachine = new WorkflowStateMachine()
