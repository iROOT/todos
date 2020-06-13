const serve = require('koa-static');
const Router = require('koa-router');
const json = require('koa-json');
const bodyParser = require('koa-bodyparser');
const Koa = require('koa');

const app = new Koa();
const router = new Router();

const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'todos',
    user: 'postgres',
    password: 'postgres',
});

async function init() {
    // var { rowCount } = await pool.query(`SELECT FROM pg_database WHERE datname = 'todos'`);
    // if (rowCount === 0) {
    //     await pool.query(`
    //         CREATE DATABASE todos
    //             WITH 
    //             OWNER = postgres
    //             ENCODING = 'UTF8'
    //             LC_COLLATE = 'Russian_Russia.1251'
    //             LC_CTYPE = 'Russian_Russia.1251'
    //             TABLESPACE = pg_default
    //             CONNECTION LIMIT = -1;`);
    // }
    var { rowCount } = await pool.query(`SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'todos'`);
    if (rowCount === 0) {
        await pool.query(`CREATE TABLE public.todos (
            id uuid NOT NULL DEFAULT uuid_generate_v4(),
            title character varying COLLATE pg_catalog."default" NOT NULL,
            completed boolean NOT NULL DEFAULT false
        )`);
    }
}

init().then(console.log, console.error);

router
    .get('/api/todos', async ctx => {
        const { rows } = await pool.query('SELECT id, title, completed FROM todos');
        ctx.body = rows;
    })
    .post('/api/todos', async ctx => {
        const { title, completed } = ctx.request.body;
        const { rows } = await pool.query('INSERT INTO todos(title, completed) VALUES($1, $2) RETURNING id', [title, completed]);
        ctx.body = rows[0];
    })
    .delete('/api/todos/:id', async ctx => {
        await pool.query('DELETE FROM todos WHERE id = $1', [ctx.params.id]);
        ctx.response.status = 200;
    })
    .put('/api/todos/:id', async ctx => {
        await pool.query('UPDATE todos SET completed = NOT completed WHERE id = $1', [ctx.params.id]);
        ctx.response.status = 200;
    });

app
    .use(bodyParser())
    .use(serve('static'))
    .use(router.routes())
    .use(json)
    .listen(80);
