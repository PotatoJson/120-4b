class State {
    constructor(stateMachine, player) {
        this.stateMachine = stateMachine;
        this.player = player;
    }
    enter() {}
    execute() {}
    exit() {}
}

class StateMachine {
    constructor(initialState, possibleStates, player) {
        this.player = player;
        this.states = possibleStates;
        this.transition(initialState, { isInitialState: true });
    }

    transition(newStateName, enterParams = {}){

        console.log('Transitioning to:', newStateName, 'with params:', enterParams); // Log params        
        if (this.currentState) {
            this.currentState.exit();
        }
        this.currentState = new this.states[newStateName](this, this.player);
        this.currentState.enter(enterParams); // Pass params to the enter method
    }

    step() {
        if (this.currentState) this.currentState.execute();
    }
}