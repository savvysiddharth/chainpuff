pragma solidity ^0.4.24;

contract Sorter {
    uint public size;
    uint public storedData;
    uint[3][3] public data;
    uint[3][3] public data1;
    uint[3][3] public result;

    constructor(uint initVal) public {
    	size=3;
        storedData = initVal;
        for (uint x = 0; x < size; x++)
        	for (uint y = 0; y < size; y++)
        		data[x][y]=x+y;

		for ( x = 0; x < size; x++)
	       	for ( y = 0; y < size; y++)
        		data1[x][y]=x+y+2;
        
    }

    function multiply() public{
    	
	    for (uint i = 0; i < size; i++) 
	    { 
	        for (uint j = 0; j < size; j++) 
	        { 
	            result[i][j] = 0; 
	            for (uint k = 0; k < size; k++) 
	                result[i][j] += data[i][k] *  
	                             data1[k][j]; 
	        } 
	    } 
	    storedData = result[2][2];
    }

    function get() public constant returns (uint retVal) {
        return storedData;
    }
}