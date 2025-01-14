define(['game-logic/clib'], function(Clib){

    return function (settings) {
        console.assert(settings);

        /**
         * Initial conditions object
         *  @param {object} settings
         *  @param {number} settings.baseBet - Base bet in bnbs
         *  @param {number} settings.autoCashAt
         *  @param {string} settings.onLossSelectedOpt - Options: return_to_base(def), increase_bet_by
         *  @param {number/null} settings.onLossIncreaseQty
         *  @param {string} settings.onWinSelectedOpt - Options: return_to_base(def), increase_bet_by
         *  @param {number/null} settings.onWinIncreaseQty
         **/

        return function(engine) {
            //MoneyBot\n\
            var baseBetSatoshis = settings.baseBet;
            var currentBet = baseBetSatoshis;

            var onLossIncreaseQty = Number(settings.onLossIncreaseQty);
            var onWinIncreaseQty = Number(settings.onWinIncreaseQty);
            var autoCashAt = Number(settings.autoCashAt);
            var maxBetStop = Number(settings.maxBetStop);

            console.assert(Clib.isNumber(autoCashAt));

            engine.on('game_starting', function() {
                var lastGamePlay = engine.lastGamePlay();

                if (lastGamePlay == 'LOST') {
                    if(settings.onLossSelectedOpt == 'return_to_base')
                        currentBet = baseBetSatoshis;
                    else { //increase_bet_by
                        console.assert(Clib.isNumber(onLossIncreaseQty));
                        currentBet = currentBet * onLossIncreaseQty;
                    }
                } else if(lastGamePlay == 'WON') {
                    if(settings.onWinSelectedOpt == 'return_to_base')
                        currentBet = baseBetSatoshis;
                    else {//increase_bet_by
                        console.assert(Clib.isNumber(onWinIncreaseQty));
                        currentBet = currentBet * onWinIncreaseQty;
                    }
                }

                var fixedCurrentBet = Math.floor(currentBet / 1);

                if(fixedCurrentBet > 0 && fixedCurrentBet <= engine.getBalance() && fixedCurrentBet <= engine.getMaxBet() && fixedCurrentBet <= maxBetStop) {
                    console.log("fixedCurrentBet" + fixedCurrentBet);
                    engine.placeBet(fixedCurrentBet, Math.round(autoCashAt * 100), false);
                } else {
                    engine.stop();
                    console.log('You ran out of bnbs or exceeded the max bet or betting nothing :(');
                }
            });
        }

    };
});