import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    scenarios: {
        leaderboard_read: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: 100 },
                { duration: '20s', target: 500 },
                { duration: '10s', target: 1000 },
                { duration: '10s', target: 0 },
            ],
            gracefulRampDown: '5s',
            exec: 'readLeaderboard',
        },
        problem_read: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: 50 },
                { duration: '20s', target: 200 },
                { duration: '10s', target: 0 },
            ],
            gracefulRampDown: '5s',
            exec: 'readProblem',
        }
    },
    thresholds: {
        http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
        http_req_failed: ['rate<0.01'],
    },
};

const BASE_URL = 'http://host.docker.internal:5000/api';

export function readLeaderboard() {
    const res = http.get(`${BASE_URL}/leaderboard/global`);
    check(res, { 'status is 200': (r) => r.status === 200 });
    sleep(1);
}

export function readProblem() {
    const res = http.get(`${BASE_URL}/problems/two-sum`);
    check(res, { 'status is 200': (r) => r.status === 200 });
    sleep(1);
}
