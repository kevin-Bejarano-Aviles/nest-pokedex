import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {

  constructor(
    //injeccion de modelos en el servicio
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,

    private readonly configService: ConfigService
  ){

    console.log(this.configService.get('PORT'));
    
  }
  
  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
  
      return pokemon;
      
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto;

    return this.pokemonModel.find()
      .limit(limit)
      .skip(offset)
      .sort({
        no: 1
      })
      .select('-__v');

  }

  //cambiar a termn
  async findOne(id: string) {
    let pokemon: Pokemon;
    if (!isNaN(+id)){
      pokemon = await this.pokemonModel.findOne({
        no:id
      });
    }

    if (!pokemon && isValidObjectId(id)){
      pokemon = await this.pokemonModel.findById(id);
    }

    if (!pokemon  ){
      pokemon = await this.pokemonModel.findOne({
        name: id
      });
    }

    if(!pokemon) throw new NotFoundException(`Pokemon with id, name or no "${ id }" not found`);

    return pokemon;
  }

  async update(id: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(id);

    if (updatePokemonDto.name)
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();

    try {
      await pokemon.updateOne(updatePokemonDto,{ new: true });
  
      return {...pokemon.toJSON(),...updatePokemonDto};
      
    } catch (error) {
      this.handleExceptions(error);  
    }


  }

  async remove(id: string) {
    // const pokemon = await this.findOne(id);
    // await pokemon.deleteOne();
    const {deletedCount,acknowledged} = await this.pokemonModel.deleteOne({_id: id});
    if(deletedCount === 0){
      throw new BadRequestException(`Pokemon with de Id "${id}" not found`)
    }

    return;
    
    
  }

  private handleExceptions(error: any){
    if(error.code === 1100){
      throw new BadRequestException(`Pokemon exist in db ${JSON.stringify(error.keyValue)}`)
    }
    console.log(error);
    throw new InternalServerErrorException(`Cant't create pokemon - Check server logs `)      
  }
}
