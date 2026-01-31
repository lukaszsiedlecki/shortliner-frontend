# Używamy obrazu Node.js do zbudowania aplikacji
FROM node:22 AS build

# Ustawiamy katalog roboczy
WORKDIR /app

# Kopiujemy pliki package.json i package-lock.json
COPY package*.json ./

# Instalujemy zależności
RUN npm install

# Kopiujemy resztę plików aplikacji
COPY . .

RUN rm -f .env

# Budujemy aplikację produkcyjną
RUN npm run build

# Używamy obrazu Nginx do serwowania aplikacji
FROM nginx:alpine

# Kopiujemy zbudowaną aplikację do katalogu Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Ustawiamy port na którym Nginx będzie nasłuchiwać
EXPOSE 80

# Uruchamiamy Nginx
CMD ["nginx", "-g", "daemon off;"]
