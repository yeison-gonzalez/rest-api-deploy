const express = require("express");
const crypto = require("node:crypto");
const cors = require("cors");
const movies = require("./movies.json");
const { validateMovie, validatePartialMovie } = require("./schemas/movies");

const app = express();
const ACCEPTED_ORIGINS = ["http://localhost:8080", "*"];
const PORT = process.env.PORT ?? 1234;

// Way using library cors
app.use(
  cors({
    origin: (origin, callback) => {
      if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());
app.disable("x-powered-by");

app.get("/movies", (req, res) => {
  // Way solving cors manually
  const origin = req.header("origin");
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  const { genre } = req.query;
  if (genre) {
    const filterMovies = movies.filter((movie) =>
      movie.genre?.some((g) => g.toLowerCase() === genre.toLowerCase())
    );
    return res.json(filterMovies);
  }
  res.json(movies);
});

app.get("/movies/:id", (req, res) => {
  const { id } = req.params;

  const movie = movies.find((movie) => movie.id === id);

  if (movie) return res.json(movie);
  res.status(404).json({ message: "Movie not found" });
});

app.post("/movies", (req, res) => {
  const result = validateMovie(req.body);

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data,
  };

  movies.push(newMovie);

  res.status(201).json(newMovie);
});

app.delete("/movies/:id", (req, res) => {
  const origin = req.header("origin");
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1)
    return res.status(404).json({ error: "Movie can't be deleted" });

  movies.splice(movieIndex, 1);

  res.json({ message: "Movie was deleted" });
});

app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body);

  if (!result.success)
    return res.status(400).json({ error: JSON.parse(result.error.message) });

  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1)
    return res.status(404).json({ message: "Movie not found" });

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  };

  movies[movieIndex] = updateMovie;

  res.json(updateMovie);
});

app.options("/movies/:id", (req, res) => {
  const origin = req.header("origin");
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
  }
  res.send(200);
});

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`);
});
