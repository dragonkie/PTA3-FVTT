export default {
    /*--------------------------------------------------------------*/
    /*                         LOCALIZATION                         */
    /*--------------------------------------------------------------*/
    localize(str) {return game.i18n.localize(str);},
    format(str, data) { return game.i18n.format(str, data); },
    honourLevel(num) {
        let level = 1;
        let cost = 1;
        let count = 0;
        while(num > cost) {
            num -= cost;
            level += 1;
            count += 1;
            if (count >= 3) {
                count = 0;
                cost = Math.min(cost+1, 5);
            }
        }
        return level;
    },

}