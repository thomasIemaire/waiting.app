import { BehaviorSubject, Observable } from "rxjs";

export class Behavior<T> {
    private subject: BehaviorSubject<T>;

    constructor(initialValue: T) {
        this.subject = new BehaviorSubject(initialValue);
    }

    get value$(): Observable<T> {
        return this.subject.asObservable();
    }

    get value(): T {
        return this.subject.getValue();
    }

    set(value: T): void {
        this.subject.next(value);
    }

    update(fn: (old: T) => T): void {
        this.subject.next(fn(this.subject.getValue()));
    }
}
