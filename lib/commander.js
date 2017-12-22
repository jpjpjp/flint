const when = require('when');
const _ = require('lodash');

class Commander {

  constructor(flint) {
    this.flint = flint;
  }

  message(msg) {
    if (msg.personEmail === this.flint.person.emails[0]) {
      return when(false);
    }
    return this.flint.trigger.create(msg)
      .then(trigger => this.flint.authorization(trigger))
      .then((trigger) => {
        // filter
        const foundMatches = _.filter(this.flint.lexicon, (lex) => {
          if (_.has(lex, 'phrase')) {
            // check regex phrases
            if (lex.phrase instanceof RegExp && lex.phrase.test(trigger.text)) {
              return true;
            }

            // check string phrases
            if (typeof lex.phrase === 'string') {
              return trigger.asString.split(' ')[0] === lex.phrase;
            }

            // check array match
            if (lex.phrase instanceof Array) {
              return (_.intersection(lex.phrase, trigger.asArray).length === lex.phrase.length);
            }
          }
          return false;
        });

        if (foundMatches && foundMatches.length > 0) {
          const bot = this.flint.bot.build(trigger.roomId, trigger.membershipId);
          _.forEach(foundMatches, foundMatch => foundMatch.action(bot, trigger));
        }

        return when(true);
      })
      .catch((err) => {
        this.flint.logger.log('error', err);
        return when(true);
      });
  }

}

module.exports = Commander;