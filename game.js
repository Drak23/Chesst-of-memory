// =============================================================================
// CHESST OF MEMORY: LA TORRE
// =============================================================================

window.addEventListener("load", () => {

    // 1. Inicializar el motor KAPLAY
    kaplay({
        canvas: document.getElementById("game-canvas"),
        width: 800,
        height: 800,
        letterbox: true,
        background: [15, 15, 20],
    });

    // 2. Módulo del Jefe: La Torre
    const BossModule = {
        createBossVisor() {
            add([
                rect(180, 180),
                pos(20, 20),
                color(30, 30, 40),
                outline(3, rgb(255, 50, 80)),
            ]);

            add([
                text("LA TORRE", { size: 16 }),
                pos(110, 40),
                anchor("center"),
                color(255, 80, 100)
            ]);

            const bossSprite = add([
                rect(80, 100),
                pos(110, 115),
                anchor("center"),
                color(80, 80, 100),
                outline(2, rgb(200, 200, 220))
            ]);

            const bossEyes = add([
                rect(50, 10),
                pos(110, 95),
                anchor("center"),
                color(0, 255, 200)
            ]);

            return { bossSprite, bossEyes };
        },

        executeBossAttack(stage, player, bossEyes, onHitCallback, setNarratorMsg) {
            bossEyes.color = rgb(255, 0, 0);
            setNarratorMsg("¡ALERTA! La Torre está preparando una embestida...");

            const isHorizontal = rand() > 0.5;
            const targetY = isHorizontal ? rand(260, 660) : 0;
            const targetX = !isHorizontal ? rand(60, 680) : 0;

            const warningTime = stage === 3 ? 0.9 : (stage === 2 ? 1.2 : 1.6);

            const hazardArea = add([
                rect(isHorizontal ? 720 : 60, isHorizontal ? 60 : 480),
                pos(isHorizontal ? 40 : targetX, isHorizontal ? targetY : 240),
                color(255, 50, 50),
                opacity(0.35),
                area(),
                "hazard"
            ]);

            wait(warningTime, () => {
                hazardArea.opacity = 0.85;

                if (player.isColliding(hazardArea)) {
                    onHitCallback();
                }

                wait(0.5, () => {
                    destroy(hazardArea);
                    bossEyes.color = rgb(0, 255, 200);
                });
            });
        }
    };

    // 3. Módulo del Jugador
    const PlayerModule = {
        createPlayer() {
            const player = add([
                rect(30, 30),
                pos(60, 330),
                color(0, 220, 255),
                outline(2, rgb(255, 255, 255)),
                area(),
                body(),
                "player"
            ]);

            const SPEED = 220;

            onKeyDown("left", () => player.move(-SPEED, 0));
            onKeyDown("a", () => player.move(-SPEED, 0));

            onKeyDown("right", () => player.move(SPEED, 0));
            onKeyDown("d", () => player.move(SPEED, 0));

            onKeyDown("up", () => player.move(0, -SPEED));
            onKeyDown("w", () => player.move(0, -SPEED));

            onKeyDown("down", () => player.move(0, SPEED));
            onKeyDown("s", () => player.move(0, SPEED));

            player.onUpdate(() => {
                player.pos.x = clamp(player.pos.x, 25, 745);
                player.pos.y = clamp(player.pos.y, 225, 725);
            });

            return player;
        },

        setupPlayerInteractions(player, gameState, updateHUD, advanceStage) {
            player.onCollide("pointA", () => {
                if (!gameState.hasItem) {
                    gameState.hasItem = true;
                    player.color = rgb(255, 220, 50);
                    updateHUD("item_picked");
                }
            });

            player.onCollide("pointB", () => {
                if (gameState.hasItem) {
                    gameState.hasItem = false;
                    gameState.deliveries++;
                    player.color = rgb(0, 220, 255);

                    if (gameState.deliveries >= gameState.requiredDeliveries) {
                        advanceStage();
                    } else {
                        updateHUD("item_delivered");
                    }
                }
            });
        },

        applyPlayerDamage(player, gameState, updateHUD, onDefeat) {
            if (gameState.isInvulnerable) return;

            gameState.playerHealth--;
            gameState.isInvulnerable = true;
            shake(12);
            updateHUD("damage");

            if (gameState.playerHealth <= 0) {
                onDefeat();
            } else {
                player.opacity = 0.4;
                wait(1.2, () => {
                    player.opacity = 1;
                    gameState.isInvulnerable = false;
                });
            }
        }
    };

    // 4. Escena Principal de la Pelea
    scene("boss_fight", () => {

        const gameState = {
            currentStage: 1,
            deliveries: 0,
            requiredDeliveries: 2,
            hasItem: false,
            playerHealth: 3,
            isInvulnerable: false
        };

        const { bossSprite, bossEyes } = BossModule.createBossVisor();

        add([
            rect(560, 180),
            pos(220, 20),
            color(25, 25, 35),
            outline(3, rgb(80, 120, 200)),
        ]);

        const hudStageText = add([text("ETAPA: 1 (APRENDIZAJE)", { size: 16 }), pos(240, 40), color(0, 240, 255)]);
        const hudProgressText = add([text("Entregas: 0 / 2  |  Item: NINGUNO", { size: 14 }), pos(240, 80), color(255, 255, 100)]);
        const hudHealthText = add([text("Salud Implícita: [ III ]", { size: 14 }), pos(240, 115), color(100, 255, 100)]);
        const hudMsgText = add([text("Narrador: 'Lleva la reliquia desde A hasta B'", { size: 13 }), pos(240, 150), color(160, 160, 180)]);

        function updateHUD(event) {
            const healthBars = ["", "[ I ]", "[ II ]", "[ III ]"];
            hudHealthText.text = `Salud Implícita: ${healthBars[gameState.playerHealth] || "[ AGOTADA ]"}`;

            if (event === "item_picked") {
                hudProgressText.text = `Entregas: ${gameState.deliveries} / ${gameState.requiredDeliveries}  |  Item: LLEVAS RELIQUIA`;
                hudMsgText.text = "Narrador: '¡Reliquia recogida! Corre al Altar (B)'";
            } else if (event === "item_delivered") {
                hudProgressText.text = `Entregas: ${gameState.deliveries} / ${gameState.requiredDeliveries}  |  Item: NINGUNO`;
                hudMsgText.text = "Narrador: '¡Entrega registrada! Ve por la siguiente.'";
            } else if (event === "damage") {
                hudMsgText.text = "¡IMPACTO RECIBIDO! Esquiva la zona roja.";
            }
        }

        add([rect(760, 540), pos(20, 220), color(18, 20, 28), outline(3, rgb(100, 100, 120))]);

        add([rect(70, 70), pos(40, 240), color(40, 180, 80), outline(2, rgb(255, 255, 255)), area(), "pointA"]);
        add([text("ORIGEN\n  (A)", { size: 12 }), pos(75, 275), anchor("center"), color(255, 255, 255)]);

        add([rect(70, 70), pos(690, 670), color(220, 160, 40), outline(2, rgb(255, 255, 255)), area(), "pointB"]);
        add([text("ALTAR\n  (B)", { size: 12 }), pos(725, 705), anchor("center"), color(255, 255, 255)]);

        const wallGroup = [];
        function buildStageWalls(stage) {
            wallGroup.forEach(w => destroy(w));
            wallGroup.length = 0;

            const layouts = {
                1: [[180, 240, 20, 240], [580, 420, 20, 240], [200, 460, 240, 20]],
                2: [[180, 240, 20, 240], [580, 420, 20, 240], [200, 460, 240, 20], [420, 320, 220, 20]],
                3: [[180, 240, 20, 240], [580, 420, 20, 240], [200, 460, 240, 20], [420, 320, 220, 20], [360, 560, 20, 140]]
            };

            layouts[stage].forEach(w => {
                const wall = add([rect(w[2], w[3]), pos(w[0], w[1]), color(70, 70, 95), outline(2, rgb(130, 130, 160)), area(), body({ isStatic: true })]);
                wallGroup.push(wall);
            });
        }

        buildStageWalls(1);

        const player = PlayerModule.createPlayer();

        function advanceStage() {
            gameState.deliveries = 0;
            gameState.currentStage++;

            if (gameState.currentStage === 2) {
                gameState.requiredDeliveries = 3;
                buildStageWalls(2);
                hudStageText.text = "ETAPA: 2 (COMPLICACIÓN AMBIENTAL)";
                hudMsgText.text = "Narrador: 'Nuevos muros bloquean el centro.'";
                hudProgressText.text = `Entregas: 0 / ${gameState.requiredDeliveries}  |  Item: NINGUNO`;
                bossSprite.color = rgb(120, 80, 80);
            } else if (gameState.currentStage === 3) {
                gameState.requiredDeliveries = 3;
                buildStageWalls(3);
                hudStageText.text = "ETAPA: 3 (FRENESÍ DE LA TORRE)";
                hudMsgText.text = "Narrador: '¡La Torre ataca con mayor frecuencia!'";
                hudProgressText.text = `Entregas: 0 / ${gameState.requiredDeliveries}  |  Item: NINGUNO`;
                bossSprite.color = rgb(180, 50, 50);
            } else {
                go("victory");
            }
        }

        PlayerModule.setupPlayerInteractions(player, gameState, updateHUD, advanceStage);

        let attackTimer = 0;
        onUpdate(() => {
            attackTimer += dt();
            const interval = gameState.currentStage === 3 ? 2.5 : 4.0;

            if (attackTimer >= interval) {
                attackTimer = 0;
                BossModule.executeBossAttack(
                    gameState.currentStage,
                    player,
                    bossEyes,
                    () => PlayerModule.applyPlayerDamage(player, gameState, updateHUD, () => go("defeat")),
                    (msg) => { hudMsgText.text = msg; }
                );
            }
        });
    });

    scene("defeat", () => {
        add([text("HAS SIDO APLASTADO POR LA TORRE\n\nPresiona ESPACIO para reintentar", { size: 20, align: "center" }), pos(400, 400), anchor("center"), color(255, 70, 90)]);
        onKeyPress("space", () => go("boss_fight"));
    });

    scene("victory", () => {
        add([text("¡VICTORIA!\n\nHas derrocado a La Torre y obtenido la Llave de Hierro.\n\nPresiona ESPACIO para continuar", { size: 20, align: "center" }), pos(400, 400), anchor("center"), color(80, 255, 120)]);
        onKeyPress("space", () => go("boss_fight"));
    });

    go("boss_fight");
});