import TelemetryEvent from "./TelemetryEvent";
import {
    CompletedEvents,
    EventCount,
    EventCountByCorrelationId,
    InProgressEvents,
    TelemetryConfig,
    TelemetryPlatform,
    TelemetryEmitter
} from "./TelemetryTypes";
import DefaultEvent from "./DefaultEvent";
import ApiEvent, { API_EVENT_IDENTIFIER } from "./ApiEvent";
import { Logger } from "../logger/Logger";
import HttpEvent from "./HttpEvent";
import { ICrypto } from '../crypto/ICrypto';

export default class TelemetryManager {

    // correlation Id to list of events
    private completedEvents: CompletedEvents = {};
    // event key to event
    private inProgressEvents: InProgressEvents = {};
    // correlation id to map of eventname to count
    private eventCountByCorrelationId: EventCountByCorrelationId = {};

    // Implement after API EVENT
    private onlySendFailureTelemetry: boolean = false;
    private telemetryPlatform: TelemetryPlatform;
    private clientId: string;
    private telemetryEmitter: TelemetryEmitter;
    private logger: Logger;
    private crypto: ICrypto;

    constructor(config: TelemetryConfig, telemetryPlatform: TelemetryPlatform, telemetryEmitter: TelemetryEmitter, logger: Logger, crypto: ICrypto) {
        // TODO THROW if bad options
        this.telemetryPlatform = telemetryPlatform;
        this.clientId = config.clientId;
        this.onlySendFailureTelemetry = config.onlySendFailureTelemetry;
        /*
         * TODO, when i get to wiring this through, think about what it means if
         * a developer does not implement telem at all, we still instrument, but telemetryEmitter can be
         * optional?
         */
        this.telemetryEmitter = telemetryEmitter;
        this.logger = logger;
        this.crypto = crypto;
    }

    static getTelemetrymanagerStub(clientId: string, logger: Logger, crypto: ICrypto) : TelemetryManager {
        const applicationName = "UnSetStub";
        const applicationVersion = "0.0";
        const telemetryEmitter = () => {};
        const telemetryPlatform: TelemetryPlatform = {
            applicationName,
            applicationVersion
        };
        const telemetryManagerConfig: TelemetryConfig = {
            platform: telemetryPlatform,
            clientId: clientId
        };

        return new this(telemetryManagerConfig, telemetryPlatform, telemetryEmitter, logger, crypto);
    }

    startEvent(event: TelemetryEvent) {
        this.logger.verbose(`Telemetry Event started: ${event.key}`);

        if (!this.telemetryEmitter) {
            return;
        }

        event.start();
        this.inProgressEvents[event.key] = event;
    }

    stopEvent(event: TelemetryEvent) {
        this.logger.verbose(`Telemetry Event stopped: ${event.key}`);

        if (!this.telemetryEmitter || !this.inProgressEvents[event.key]) {
            return;
        }
        event.stop();
        this.incrementEventCount(event);

        const completedEvents = this.completedEvents[event.telemetryCorrelationId];

        this.completedEvents[event.telemetryCorrelationId] = [...(completedEvents || []), event];

        delete this.inProgressEvents[event.key];
    }

    flush(correlationId: string): void {
        this.logger.verbose(`Flushing telemetry events: ${correlationId}`);

        // If there is only unfinished events should this still return them?
        if (!this.telemetryEmitter || !this.completedEvents[correlationId]) {
            return;
        }

        const orphanedEvents = this.getOrphanedEvents(correlationId);
        orphanedEvents.forEach(event => this.incrementEventCount(event));
        const eventsToFlush: Array<TelemetryEvent> = [
            ...this.completedEvents[correlationId],
            ...orphanedEvents
        ];

        delete this.completedEvents[correlationId];
        const eventCountsToFlush: EventCount = this.eventCountByCorrelationId[correlationId];

        delete this.eventCountByCorrelationId[correlationId];
        // TODO add funcitonality for onlyFlushFailures after implementing api event? ??

        if (!eventsToFlush || !eventsToFlush.length) {
            return;
        }

        const defaultEvent: DefaultEvent = new DefaultEvent(
            this.crypto.createNewGuid(),
            this.telemetryPlatform,
            correlationId,
            this.clientId,
            eventCountsToFlush
        );

        const eventsWithDefaultEvent = [ ...eventsToFlush, defaultEvent ];

        this.telemetryEmitter(eventsWithDefaultEvent.map(e => e.get()));
    }

    createAndStartApiEvent(correlationId: string, apiEventIdentifier: API_EVENT_IDENTIFIER): ApiEvent {
        const apiEvent = new ApiEvent(this.crypto.createNewGuid(), correlationId, this.logger.isPiiLoggingEnabled(), apiEventIdentifier);
        this.startEvent(apiEvent);
        return apiEvent;
    }

    stopAndFlushApiEvent(correlationId: string, apiEvent: ApiEvent, wasSuccessful: boolean, errorCode?: string): void {
        apiEvent.wasSuccessful = wasSuccessful;
        if (errorCode) {
            apiEvent.apiErrorCode = errorCode;
        }
        this.stopEvent(apiEvent);
        this.flush(correlationId);
    }

    createAndStartHttpEvent(correlation: string, httpMethod: string, url: string, eventLabel: string): HttpEvent {
        const httpEvent = new HttpEvent(this.crypto.createNewGuid(), correlation, eventLabel);
        httpEvent.url = url;
        httpEvent.httpMethod = httpMethod;
        this.startEvent(httpEvent);
        return httpEvent;
    }

    private incrementEventCount(event: TelemetryEvent): void {
        /*
         * TODO, name cache event different?
         * if type is cache event, change name
         */
        const eventName = event.eventName;
        const eventCount = this.eventCountByCorrelationId[event.telemetryCorrelationId];
        if (!eventCount) {
            this.eventCountByCorrelationId[event.telemetryCorrelationId] = {
                [eventName]: 1
            };
        } else {
            eventCount[eventName] = eventCount[eventName] ? eventCount[eventName] + 1 : 1;
        }
    }

    private getOrphanedEvents(correlationId: string): Array<TelemetryEvent> {
        return Object.keys(this.inProgressEvents)
            .reduce((memo, eventKey) => {
                if (eventKey.indexOf(correlationId) !== -1) {
                    const event = this.inProgressEvents[eventKey];
                    delete this.inProgressEvents[eventKey];
                    return [...memo, event];
                }
                return memo;
            }, []);
    }
}
