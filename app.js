var app = angular.module('libraryApp', []);

// Servicio para manejar los libros en localStorage
app.service('BookService', function () {
  const STORAGE_KEY = 'library_books';

  this.getBooks = function () {
    const storedBooks = localStorage.getItem(STORAGE_KEY);
    return storedBooks ? JSON.parse(storedBooks) : [];
  };

  this.saveBooks = function (books) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  };
});

// Filtro para mostrar solo los libros favoritos
app.filter('favoritesFilter', function () {
  return function (books, showFavorites) {
    // Si 'showFavorites' es true, solo se muestran los favoritos
    if (showFavorites) {
      return books.filter(book => book.isFavorite);  
    } else {
      return books;  // Si no, se muestran todos los libros
    }
  };
});



// Filtro para libros por categoría
app.filter('categoryFilter', function () {
  return function (books, selectedCategory) {
    if (!selectedCategory || selectedCategory === '') {
      return books;
    } else {
      return books.filter(function (book) {
        return book.category === selectedCategory;
      });
    }
  };
});

// Directiva para mostrar notificaciones
app.directive('notificationDirective', function () {
  return {
    restrict: 'E',
    scope: {
      notification: '=',
      onClose: '&'
    },
    template: `
      <div class="notification">
        <p>{{ notification.message }}</p>
        <button ng-click="onClose()">Cerrar</button>
      </div>
    `
  };
});

app.controller('LibraryController', function ($scope, BookService) {
  const DEFAULT_COVER = 'https://via.placeholder.com/150';

  // Cargar los libros desde el servicio
  $scope.books = BookService.getBooks();
  $scope.categories = ['Ficción', 'No Ficción', 'Ciencia', 'Historia'];
  $scope.searchQuery = '';
  $scope.selectedCategory = '';
  $scope.currentBook = {};
  $scope.notifications = [];
  $scope.booksPerPage = 5;
  $scope.currentPage = 1;
  $scope.showFavorites = false;

  // Asegurarse de que los libros están cargados correctamente
  console.log("Libros cargados: ", $scope.books);

  // Guardar o editar un libro
  $scope.saveBook = function () {
    if ($scope.isEditing) {
      const index = $scope.books.findIndex(book => book.id === $scope.currentBook.id);
      $scope.books[index] = angular.copy($scope.currentBook);
      $scope.isEditing = false;
      $scope.notify('Libro editado con éxito');
    } else {
      $scope.currentBook.id = Date.now();
      $scope.currentBook.isRead = false;
      $scope.currentBook.isFavorite = false;
      $scope.currentBook.cover = $scope.currentBook.cover || DEFAULT_COVER;
      $scope.books.push(angular.copy($scope.currentBook));
      $scope.notify('Nuevo libro agregado');
    }
    $scope.currentBook = {};
    BookService.saveBooks($scope.books);
  };

  // Editar un libro
  $scope.editBook = function (book) {
    $scope.currentBook = angular.copy(book);
    $scope.isEditing = true;
  };

  // Eliminar un libro
  $scope.removeBook = function (index) {
    $scope.books.splice(index, 1);
    BookService.saveBooks($scope.books);
    $scope.notify('Libro eliminado');
  };

  // Cambiar el estado de lectura de un libro
  $scope.toggleReadStatus = function (book) {
    book.isRead = !book.isRead;
    BookService.saveBooks($scope.books);
  };

  // Cambiar el estado de favorito de un libro
  $scope.toggleFavorite = function (book) {
    book.isFavorite = !book.isFavorite;
    BookService.saveBooks($scope.books);
  };

  // Alternar entre mostrar todos los libros o solo los favoritos
  $scope.toggleFavorites = function () {
    $scope.showFavorites = !$scope.showFavorites;
  };


  // Contar los libros leídos
  $scope.countReadBooks = function () {
    return $scope.books.filter(book => book.isRead).length;
  };

  // Contar los libros favoritos
  $scope.countFavoriteBooks = function () {
    return $scope.books.filter(book => book.isFavorite).length;
  };

  // Notificaciones
  $scope.notify = function (message) {
    $scope.notifications.push({ message: message });
    setTimeout(function () {
      $scope.clearNotification(0);
      $scope.$apply();
    }, 3000);
  };

  // Limpiar una notificación
  $scope.clearNotification = function (index) {
    $scope.notifications.splice(index, 1);
  };

  // Cambiar de página
  $scope.changePage = function (page) {
    if (page > 0 && page <= $scope.totalPages) {
      $scope.currentPage = page;
    }
  };

  // Calcular el total de páginas para la paginación
  $scope.$watch('books', function () {
    $scope.totalPages = Math.ceil($scope.books.length / $scope.booksPerPage);
  });

  // Para asegurarse de que la paginación funcione correctamente
  $scope.paginatedBooks = function () {
    const start = ($scope.currentPage - 1) * $scope.booksPerPage;
    const end = start + $scope.booksPerPage;
    return $scope.books.slice(start, end);
  };
});

