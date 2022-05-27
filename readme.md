# NodeJs REST API boilerplate

## Running the app in the development mode

Run the following command to launch the project in dev mode

```bash
  npm run dev
```

## Building the app for production

Run the following command to build the project

```bash
  npm run build
```

## Docker for development

Run the following command to launch the project inside a docker container

```bash
  docker-compose -f docker-compose.dev.yml up
```

## Docker for Production

Run the following command build & run a distroless docker container for production

```bash
  docker-compose up
```

### Note

To setup [husky](https://www.npmjs.com/package/husky) & [lint-staged](https://www.npmjs.com/package/lint-staged) for pre-commit hook run

```bash
  npm run install:husky
```
