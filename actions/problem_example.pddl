;; Test 1: Simple Movement Test
(define (problem simple-move)
    (:domain deliveroo)
    (:objects t1 t2 t3 t4 t5)
    (:init
        ;; Bidirectional Map structure
        (down t1 t2) (up t2 t1)
        (down t2 t3) (up t3 t2)
        (right t1 t4) (left t4 t1)
        (right t2 t5) (left t5 t2)

        ;; Agent starting position
        (at t1)
    )
    (:goal (at t3))  ;; Just move to t3
)

;; Test 2: Pick Up Parcels
(define (problem test-pickup)
    (:domain deliveroo)
    (:objects t1 t2 t3 t4 t5 p1)
    (:init
        ;; Map
        (down t1 t2) (up t2 t1)
        (down t2 t3) (up t3 t2)
        (right t1 t4) (left t4 t1)
        (right t2 t5) (left t5 t2)

        ;; Agent and Parcel
        (at t3)
        (parcel_at p1 t3)
    )
    (:goal (carrying p1))  ;; Just pick up the parcel
)

;; Test 3: Put Down Parcels
(define (problem test-dropoff)
    (:domain deliveroo)
    (:objects t1 t2 t3 t4 p1)
    (:init
        ;; Map connectivity
        (right t1 t2) (left t2 t1)
        (right t2 t3) (left t3 t2)
        (right t3 t4) (left t4 t3)

        ;; Agent starts at t1, carrying a parcel
        (at t1)
        (carrying p1)
    )
    (:goal
        (parcel_at p1 t4)  ;; Parcel should be at t4 after drop-off
    )
)

;; Single particle
(define (problem dynamic-delivery)
    (:domain deliveroo)
    (:objects
        t1 t2 t3 t4 t5   ;; Tiles in the grid
        p1               ;; Parcels
    )
    (:init
        ;; Map structure (direction new_pos old_pos)
        (down t1 t2) (up t2 t1)
        (left t2 t3) (right t3 t2)
        (right t1 t4) (left t4 t1)
        (left t3 t5) (right t5 t3)

        ;; Agent starting position
        (at t1)

        ;; Parcel locations
        (parcel_at p1 t5)
    )
    (:goal
        (and
            (carrying p1)   ;; Deliver parcel 1 to t4
        )
    )
)

;; Multiple particles
(define (problem dynamic-delivery)
    (:domain deliveroo)
    (:objects
        t1 t2 t3 t4 t5   ;; Tiles in the grid
        p1 p2            ;; Parcels
    )
    (:init
        ;; Map structure
        (down t1 t2) (up t2 t1)
        (down t2 t3) (up t3 t2)
        (right t1 t4) (left t4 t1)
        (right t2 t5) (left t5 t2)

        ;; Agent starting position
        (at t1)

        ;; Parcel locations
        (parcel_at p1 t3)
        (parcel_at p2 t5)
    )
    (:goal
        (and
            (parcel_at p1 t4)   ;; Deliver parcel 1 to t4
            (parcel_at p2 t2)   ;; Deliver parcel 2 to t2
        )
    )
)
