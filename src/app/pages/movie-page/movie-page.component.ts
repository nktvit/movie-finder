import {Component} from '@angular/core';
import {MovieService} from '../../services/movie.service';
import {ActivatedRoute} from '@angular/router';
import {NgClass, NgFor, NgIf, NgOptimizedImage} from '@angular/common';
import {NavbarComponent} from '../../components/navbar/navbar.component';
import {BackButtonComponent} from '../../components/back-button/back-button.component';
import {MoviePlayerComponent} from "../../components/movie-player/movie-player.component";
import {catchError, finalize, of, switchMap, tap} from "rxjs";

@Component({
  selector: 'app-movie-page',
  standalone: true,
  imports: [NgIf, NgFor, NavbarComponent, BackButtonComponent, NgClass, NgOptimizedImage, MoviePlayerComponent],
  templateUrl: './movie-page.component.html',
  styleUrl: './movie-page.component.css'
})
export class MoviePageComponent {
  isLoading = false;
  invalidResponse: boolean = false;
  isFullPlot = false;
  shouldClamp = false;
  isPlotLong = false;
  adjustedPlot = '';
  movieId: string = "";
  movieDetails: any = {};
  movieDetailsArray: any[] = [];
  protected type: string = 'movie';
  protected imdbId: any;

  constructor(private movieService: MovieService, private route: ActivatedRoute) {
  }


  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id !== null) {
          this.movieId = id;
          this.isLoading = true;
          return this.movieService.getMovieDetails(this.movieId).pipe(
            finalize(() => this.isLoading = false),
            catchError((error) => {
              console.error('Error fetching movie details: ', error);
              this.invalidResponse = true;
              return of(null);
            })
          );
        }
        return of(null);
      }),
      tap(details => {
        if (details) {
          this.invalidResponse = false;
          this.movieDetails = details
          // UI logic
          this.movieDetailsArray = this.movieService.formatMovieDetailsArray(details);
          this.imdbId = this.movieService.getImdbId(details);
          this.type = this.movieService.getMediaType(details);

          this.adjustedPlot = this.adjustPlot(this.movieDetails.Plot);
          this.isPlotLong = this.adjustedPlot.length > 300;
          this.shouldClamp = !this.isFullPlot && this.isPlotLong;
        }
      })
    ).subscribe();
  }

  togglePlot() {
    this.isFullPlot = !this.isFullPlot;
    this.shouldClamp = !this.isFullPlot && this.isPlotLong;
  }

  adjustPlot(plot: string): string {
    // Remove trailing comma if it exists
    if (!plot) {
      return '';
    }

    let adjusted: string = plot.trim();
    if (adjusted.endsWith(',')) {
      adjusted = adjusted.slice(0, -1);
    }
    return adjusted;
  }
}
