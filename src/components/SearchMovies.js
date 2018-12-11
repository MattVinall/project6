import React, { Component } from "react";
import firebase from "../firebase";
import { withRouter } from "react-router-dom";
import axios from "axios";
import RenderMovies from "./Movies";
import swal from "sweetalert";
import { Link } from "react-router-dom";

class SearchMovies extends Component {
  constructor() {
    super();
    this.state = {
      movies: [],
      searchTerm: "",
      searchParam: ""
      // genreId: []
    };
  }

  // this is necessary so we can do a check for running count here
  componentDidMount() {
    this.populateGroupMoviesDBRef = firebase.database().ref(`userGroups/`);
    this.populateGroupMoviesDBRef.on("value", snapshot => {
      Object.entries(snapshot.val()).forEach(group => {
        if (group[1].groupID === this.props.match.params.group_id) {
          this.firebaseKey = group[0];
          this.props.getMovieArray(group[1].movies);
          // this.props.getCurrGroup(group[1]);
        }
      });
    });
  }

  componentWillUnmount() {
    // this is called when a component leaves the page
    // in our single page app with one component, it will never be called
    // if we were rerouting to a different view, it would be called when the route changed.

    // turn off all dbRefs called in this component after any sort of re-routing
    if (this.populateGroupMoviesDBRef) {
      this.populateGroupMoviesDBRef.off();
    }
    if (this.specificGroup) {
      this.specificGroup.off();
    }
  }

  favouriteMovie = movieObject => {
    swal(`Movie saved to your group favourites!`, { icon: "success" });

    let foundDuplicate = false;
    this.specificGroup = firebase
      .database()
      .ref(`userGroups/${this.firebaseKey}/movies`);

    this.props.currGroupMoviesCollection.forEach(movies => {
      for (let movie in movies) {
        if (movie === "id") {
          const idArray = movies[movie];
          if (idArray === movieObject.id) {
            console.log(true);
            this.specificGroup.once("value", snapshot => {
              const movieDB = snapshot.val();
              //movie is the firebase key consisting of that specific movie object in firebase
              for (let movie in movieDB) {
                if (movieObject.id === movieDB[movie].id) {
                  foundDuplicate = true;
                  this.countSpecificMovieDBRef = firebase
                    .database()
                    .ref(
                      `userGroups/${this.firebaseKey}/movies/${movie}/count`
                    );
                  this.countSpecificMovieDBRef.once("value", countSnapshot => {
                    const count = countSnapshot.val();
                    this.countSpecificMovieDBRef.set(count + 1);
                  });
                }
              }
            });
          }
        }
      }
    });
    if (foundDuplicate === false) {
      let newMovieObject = movieObject;
      newMovieObject.count = 1;
      this.specificGroup.push(movieObject);
    }
  };

  handleChange = e => {
    this.setState({
      [e.target.id]: e.target.value
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    // clears the search term and THEN use a callback function to get the movies from the API
    this.setState(
      {
        searchParam: this.state.searchTerm,
        searchTerm: "",
        movies: []
      },
      () => {
        this.getMovies(e);
      }
    );
  };

  getMovies = () => {
    axios
      .get("https://api.themoviedb.org/3/search/movie", {
        params: {
          api_key: "0613920bcfda4651982add49adcb7163",
          language: "en-US",
          sort_by: "popularity.desc",
          query: this.state.searchParam
        }
      })
      .then(res => {
        const filteredResults = res.data.results.filter(
          movie => movie.poster_path !== null && movie.genre_ids !== []
        );
        const idArray = filteredResults.map(id => {
          return id;
        });
        return idArray;
      })
      .then(idArray => {
        // console.log(idArray);
        this.getMovieId(idArray);
      });
  };

  movieIdCall = id => {
    return axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
      params: {
        api_key: "0613920bcfda4651982add49adcb7163",
        language: "en-US"
      }
    });
  };

  getMovieId = array => {
    // Working version (not great)
    array.forEach(movie => {
      axios
        .get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
          params: {
            api_key: "0613920bcfda4651982add49adcb7163",
            language: "en-US"
          }
        })
        .then(results => {
          const movieIdArray = this.state.movies;
          const thisMovie = results.data;
          movieIdArray.push(thisMovie);
          this.setState({
            movies: movieIdArray
          });
        });
    });
  };

  render() {
    return (
      <div>
        {/* SF SAT changes start here */}
        <header className="pageHeader">
          <div className="wrapper headerContent">
            <h2>
              <span className="underline">Movies</span>
            </h2>
          </div>
          <Link to={`/group/${this.props.match.params.group_id}`}>
            <div className="backButton">
              Return to group
            </div>
          </Link>
        </header>
        {/* Header changes end */}
        {/* SF SAT pu form in section w wrapper div */}
        <section className="searchBar">
          <div className="wrapper searchContainer">
            <form
              onSubmit={this.handleSubmit}
              action=""
              className="searchForm clearfix"
            >
              <label htmlFor="searchTerm">Search for a Movie!</label>
              <input
                value={this.state.searchTerm}
                onChange={this.handleChange}
                id="searchTerm"
                type="text"
              />
              <input type="submit" value="search" />
            </form>
          </div>
        </section>

        <RenderMovies
          // handleClick={this.handleClick}
          favouriteMovie={this.favouriteMovie}
          movies={this.state.movies}
        />
      </div>
    );
  }
}

export default withRouter(SearchMovies);

// getGenre = () => {
//     axios
//         .get("https://api.themoviedb.org/3/genre/movie/list", {
//             params: {
//                 api_key: "0613920bcfda4651982add49adcb7163",
//                 language: "en-US"
//             }
//         })
//         .then(res => {
//             // console.log(res);
//             const genreId = res.data.genres;
//             // console.log(res.data.genres);
//             this.setState({
//                 genreId
//             });
//             // go through each movie and assign it to the variable currentMovie
//             this.state.movies.forEach(movie => {
//                 const currentMovie = movie;

//                 // go through the genre array in each movie and assign it to the variable currentGenre
//                 movie.genre_ids.forEach(genre => {
//                     // console.log(genre);
//                     const currentGenre = genre;
//                     // console.log(currentGenre);

//                     // go through the list of genres from the axios call and check if the id matches the id of the currentGenre
//                     this.state.genreId.forEach(genre => {
//                         if (genre.id === currentGenre) {
//                             // console.log(currentMovie.genre_ids.indexOf(currentGenre));

//                             // go back to the currentMovie object and get the indexOf the matching currentGenre of the list of genres
//                             const indexOfGenre = currentMovie.genre_ids.indexOf(
//                                 currentGenre
//                             );
//                             //reassign the genre_id number to its matching genre name
//                             currentMovie.genre_ids[indexOfGenre] = genre.name;
//                             // console.log(currentMovie);
//                             // return currentMovie.genre_ids.indexOf(currentGenre);
//                         }
//                     });
//                 });
//             });
//         });
// };
