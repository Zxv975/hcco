// ctx.patch(Player, "onBeingHit").replace(function (o) {
//     if (this.target.firstHit) {
//         let gpToAdd = this.modifiers.increasedGPWhenHitBasedOnDR * this.stats.damageReduction;
//         if (gpToAdd > 0) {
//             gpToAdd = applyModifier(gpToAdd, this.modifiers.increasedGPGlobal - this.modifiers.decreasedGPGlobal);
//             this.game.gp.add(gpToAdd);
//             this.game.stats.Combat.add(CombatStats.GPEarned, gpToAdd);
//         }
//     }
//     if (this.modifiers.increasedPrayerPointsWhenHit > 0)
//         this.addPrayerPoints(this.modifiers.increasedPrayerPointsWhenHit);
//     if (this.modifiers.shadowCloak > 0)
//         this.applyModifierEffect(shadowCloakEffect, this.target, this.game.normalAttack);
//     // if (this.modifiers.increased5DROnBeingHit > 0)
//     //     this.applyModifierEffect(increased5DROnHitEffect, this, this.game.normalAttack);
//     super.onBeingHit();
// })

data = {
    "conditionalModifiers": [
        {
            "condition": {
                "type": "Some",
                "conditions": [
                    {
                        "type": "IsStunned",
                        "character": "Player",
                        "flavour": "Shocked",
                        "inverted": false
                    },
                    {
                        "type": "IsStunned",
                        "character": "Player",
                        "flavour": "Stun",
                        "inverted": false
                    }
                ]
            },
            "modifiers": {
                "increasedHealWhenStunned": 10
            }
        }
    ]
}

// {
//     "id": "Leviathan",
//     "effectData": {
//         "effectType": "Custom",
//         "type": "Reflexive",
//         "modifiers": {
//             "increasedReflectDamage": 5,
//             "increasedDamageReduction": 1
//         },
//         "maxStacks": 5,
//         "media": "assets/media/status/evasion_increase.svg",
//         "turns": "Infinity",
//         "name": "Spiky Skin"
//     }
// },
// {
//     "id": "Rage",
//     "effectData": {
//         "effectType": "Custom",
//         "type": "Reflexive",
//         "modifiers": {
//             "increasedMaxHitPercent": 2,
//             "decreasedAttackIntervalPercent": 2
//         },
//         "maxStacks": 10,
//         "media": "assets/media/status/attack_increase.svg",
//         "turns": "Infinity",
//         "name": "Rage"
//     }
// },



itemEffects = {
    "itemEffects": [
        {
            "id": "melvorTotH:Bundled_Protection_Body",
            "effectData": {
                "effectType": "Custom",
                "type": "Reflexive",
                "conditionalModifiers": [
                    {
                        "condition": {
                            "type": "Some",
                            "conditions": [
                                {
                                    "type": "Effect",
                                    "character": "Player",
                                    "flavour": "Shocked",
                                    "inverted": false
                                },
                                {
                                    "type": "IsStunned",
                                    "character": "Player",
                                    "flavour": "Stun",
                                    "inverted": false
                                }
                            ]
                        },
                        "modifiers": {
                            "increasedDamageReduction": 5,
                            "increasedHealWhenStunned": 10
                        },
                        "maxStacks": 1,
                        "media": "assets/media/status/attack_increase.svg",
                        "turns": "Infinity",
                        "name": "Bundle"
                    }
                ]
            }
        },
        {
            "id": "melvorTotH:FrostSpark_Amulet",
            "effectData": {
                "effectType": "Custom",
                "type": "Reflexive",
                "conditionalModifiers": [
                    {
                        "condition": {
                            "type": "Some",
                            "conditions": [
                                {
                                    "type": "Effect",
                                    "character": "Player",
                                    "effectType": "Slow",
                                    "inverted": false
                                },
                                {
                                    "type": "IsStunned",
                                    "character": "Player",
                                    "flavour": "Freeze",
                                    "inverted": false
                                }
                            ]
                        },
                        "modifiers": {
                            "increasedFlatMaxHitpoints": 8,
                            "increasedDamageReduction": 3,
                            "increasedHealWhenStunned": 7
                        },
                        "maxStacks": 1,
                        "media": "assets/media/status/attack_increase.svg",
                        "name": "Rage"
                    }
                ]
            }
        }
    ]
}



game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers = {}
game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').conditionalModifiers.push(new ConditionalModifier(data, game, game.items.getObjectByID('melvorTotH:Bundled_Protection_Body')))