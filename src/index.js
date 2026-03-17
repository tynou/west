import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card {
    constructor(name, maxPower) {
        super(name, maxPower);
    }

    getDescriptions() {
        const creatureDescription = getCreatureDescription(this);
        const descriptions = super.getDescriptions();
        return [creatureDescription, ...descriptions];
    }
}

class Duck extends Creature {
    constructor() {
        super("Мирная утка", 2);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}

class Dog extends Creature {
    constructor(name = "Пес-бандит", maxPower = 3) {
        super(name, maxPower);
    }
}

class Trasher extends Dog {
    constructor(name = "Громила", maxPower = 5) {
        super(name, maxPower);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(
            () => super.modifyTakenDamage(value - 1, fromCard, gameContext, continuation)
        );
    };

    getDescriptions() {
        return [...super.getDescriptions(), "Получает на 1 меньше урона"];
    }
}

class Gatling extends Creature {
    constructor(name = "Гатлинг", maxPower = 6) {
        super(name, maxPower);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const enemyCards = gameContext.oppositePlayer.table.filter(card => card != null);
        enemyCards.forEach(card => {
            taskQueue.push(onDone => {
                this.view.showAttack(() => {});
                this.dealDamageToCreature(2, card, gameContext, onDone);
            });
        });
        taskQueue.continueWith(continuation);
    }
}

class Lad extends Dog {
    constructor(name = "Братки", maxPower = 2) {
        super(name, maxPower);
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        super.modifyDealedDamageToCreature(value + Lad.getBonus(), toCard, gameContext, continuation);
    };

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        super.modifyTakenDamage(value - Lad.getBonus(), fromCard, gameContext, continuation);
    };

    doAfterComingIntoPlay(gameContext, continuation) {
        this.inGameCount += 1;
        super.doAfterComingIntoPlay(gameContext, continuation);
    };

    doBeforeRemoving(continuation) {
        this.inGameCount -= 1;
        super.doBeforeRemoving(continuation);
    };

    getDescriptions() {
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') || Lad.prototype.hasOwnProperty('modifyTakenDamage')) {
            return [...super.getDescriptions(), "Чем их больше, тем они сильнее"];
        }
        return super.getDescriptions();
    }


    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const n = this.getInGameCount();
        return n * (n + 1) / 2;
    }
}

class Rogue extends Creature {
    constructor(name = "Изгой", maxPower = 2) {
        super(name, maxPower);
    }

    doBeforeAttack(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        const targetCard = oppositePlayer.table[position];

        if (!(targetCard instanceof Rogue)) {
            const targetProto = Object.getPrototypeOf(targetCard);

            const allCards = [...currentPlayer.table, ...oppositePlayer.table];
            for (const card of allCards) {
                if (card && Object.getPrototypeOf(card) === targetProto) {
                    Rogue.abilitiesToSteal.forEach(ability => {
                        if (targetProto.hasOwnProperty(ability)) {
                            this[ability] = targetProto[ability];
                            delete targetProto[ability];
                        }
                    });
                }
            }

            updateView();
        }

        super.doBeforeAttack(gameContext, continuation);
    };

    static get abilitiesToSteal() {
        return ['modifyDealedDamageToCreature', 'modifyDealedDamageToPlayer', 'modifyTakenDamage'];
    }
}

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}


const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
];
const banditStartDeck = [
    new Lad(),
    new Lad(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
