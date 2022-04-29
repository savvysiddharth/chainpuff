pragma solidity ^0.4.24;

contract Sorter {
    uint size;

    constructor(uint matrixDimension) public {
    	size=matrixDimension;
    }

    function multiply() public{
        uint size1 = 4;
        uint[4][4] memory data;
        uint[4][4] memory data1;
        uint[4][4] memory result;

        for (uint x = 0; x < size1; x++)
            for (uint y = 0; y < size1; y++)
                data[x][y]=x+y;

        for ( x = 0; x < size1; x++)
            for ( y = 0; y < size1; y++)
                data1[x][y]=x+y+2;
    	
	    for (uint i = 0; i < size1; i++) 
	    { 
	        for (uint j = 0; j < size1; j++) 
	        { 
	            result[i][j] = 0; 
	            for (uint k = 0; k < size1; k++) 
	                result[i][j] += data[i][k] *  
	                             data1[k][j]; 
	        } 
	    }
    }
}