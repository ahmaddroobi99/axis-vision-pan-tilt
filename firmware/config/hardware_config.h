#pragma once

#define PAN_STEP_PIN          GPIO_PIN_0
#define PAN_STEP_PORT         GPIOA
#define PAN_DIR_PIN           GPIO_PIN_1
#define PAN_DIR_PORT          GPIOA
#define PAN_ENABLE_PIN        GPIO_PIN_2
#define PAN_ENABLE_PORT       GPIOA

#define TILT_STEP_PIN         GPIO_PIN_3
#define TILT_STEP_PORT        GPIOA
#define TILT_DIR_PIN          GPIO_PIN_4
#define TILT_DIR_PORT         GPIOA
#define TILT_ENABLE_PIN       GPIO_PIN_5
#define TILT_ENABLE_PORT      GPIOA

#define UART_INSTANCE         USART1
#define UART_BAUD             115200
#define UART_TX_PIN           GPIO_PIN_9
#define UART_RX_PIN           GPIO_PIN_10
#define UART_PORT             GPIOA

#define LIMIT_PAN_MIN_PIN     GPIO_PIN_6
#define LIMIT_PAN_MAX_PIN     GPIO_PIN_7
#define LIMIT_TILT_MIN_PIN    GPIO_PIN_8
#define ENABLE_ACTIVE_LOW     1

#define TARGET_TIMEOUT_MS     300
#define UART_TIMEOUT_MS       300
