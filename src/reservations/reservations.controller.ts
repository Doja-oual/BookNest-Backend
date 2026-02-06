import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../common/decorators';

@ApiTags('Reservations')
@Controller('reservations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une réservation pour un événement' })
  @ApiResponse({
    status: 201,
    description: 'Réservation créée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou places insuffisantes',
  })
  @ApiResponse({
    status: 409,
    description: 'Réservation déjà existante pour cet événement',
  })
  create(
    @Body() createReservationDto: CreateReservationDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.reservationsService.create(createReservationDto, userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Récupérer mes réservations' })
  @ApiResponse({
    status: 200,
    description: 'Liste des réservations de l\'utilisateur',
  })
  findMyReservations(@CurrentUser('userId') userId: string) {
    return this.reservationsService.findMyReservations(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une réservation par ID' })
  @ApiResponse({
    status: 200,
    description: 'Réservation trouvée',
  })
  @ApiResponse({
    status: 404,
    description: 'Réservation non trouvée',
  })
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler une réservation' })
  @ApiResponse({
    status: 200,
    description: 'Réservation annulée avec succès',
  })
  @ApiResponse({
    status: 403,
    description: 'Non autorisé à annuler cette réservation',
  })
  @ApiResponse({
    status: 400,
    description: 'Réservation déjà annulée',
  })
  cancel(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.reservationsService.cancel(id, userId);
  }

  @Get('event/:eventId')
  @ApiOperation({
    summary: 'Récupérer toutes les réservations d\'un événement (Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des réservations de l\'événement',
  })
  findByEvent(@Param('eventId') eventId: string) {
    return this.reservationsService.findByEvent(eventId);
  }

  @Get('event/:eventId/stats')
  @ApiOperation({
    summary: 'Récupérer les statistiques de réservation d\'un événement (Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des réservations',
  })
  getStats(@Param('eventId') eventId: string) {
    return this.reservationsService.getReservationStats(eventId);
  }
}
